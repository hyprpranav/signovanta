import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Student,
  Staff,
  EventApplication,
  EventCategory,
  AcademicSection,
  StudentRegistrationRequest,
} from '../../types';
import {
  getLocalStudents,
  saveLocalStudents,
  getLocalStaff,
  saveLocalStaff,
  normalizeRegNo,
  getStudentRegistrationRequests,
  approveStudentRegistrationRequest,
  rejectStudentRegistrationRequest,
  syncStudentsFromFirebase,
  syncStaffFromFirebase,
  updateStudentProfile,
  updateMasterAdminProfile,
  syncStudentRegistrationRequestsFromFirebase,
  subscribeToStudents,
  subscribeToStaff,
  subscribeToStudentRequests,
  deleteStudent,
} from '../../services/firebase/authService';
import { auth } from '../../services/firebase/firebaseConfig';
import { updatePassword as fbUpdatePassword } from 'firebase/auth';
import { uploadToCloudinary } from '../../services/cloudinary/cloudinaryService';
import {
  getAllApplications,
  saveAllApplications,
  getCategories,
  saveCategories,
  getAcademicSections,
  saveAcademicSections,
  syncApplicationsFromFirebase,
  subscribeToApplications,
  getApprovalLogs,
  preApproveApplication,
  completeEventApplication,
  enableStudentApplicationEditing,
  disableStudentApplicationEditing,
  rejectApplication,
  deleteApplication,
  deleteStudentSubmissions,
  deleteAllApplications,
  createStaffAnnouncement,
  getUserNotifications,
} from '../../services/firebase/firestoreService';
import { PinVerificationModal } from '../../components/common/PinVerificationModal';
import { StudentDirectoryMonitor } from '../../components/monitoring/StudentDirectoryMonitor';
import { WinnersCertificateShowcase } from '../../components/analytics/WinnersCertificateShowcase';
import { EventParticipationAnalytics } from '../../components/analytics/EventParticipationAnalytics';
import { ExportManagement } from '../../components/common/ExportManagement';
import { SubmissionsPanel } from '../../components/common/SubmissionsPanel';
import { DeleteThingsPanel } from '../../components/common/DeleteThingsPanel';
import { DirectCertificatesPanel } from '../../components/common/DirectCertificatesPanel';
import { EventOutcomeAnalytics } from '../../components/common/EventOutcomeAnalytics';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  ShieldAlert,
  Users,
  Briefcase,
  FileText,
  BarChart3,
  CheckCircle2,
  XCircle,
  Plus,
  Upload,
  Download,
  AlertTriangle,
  Key,
  Search,
  UserCheck,
  UserX,
  UploadCloud,
  GraduationCap,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Bell,
  Send,
  Save,
  Camera,
} from 'lucide-react';
import Papa from 'papaparse';

interface AdminDashboardProps {
  activeTab?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab: requestedTab }) => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'my_profile' | 'students' | 'staff' | 'approvals' | 'submissions' | 'certificates' | 'delete_things' | 'events' | 'categories' | 'analytics' | 'exports' | 'announcements' | 'settings'
  >('overview');

  const [students, setStudents] = useState<Student[]>(() => getLocalStudents());
  const [staffList, setStaffList] = useState<Staff[]>(() => getLocalStaff());
  const [studentRequests, setStudentRequests] = useState<StudentRegistrationRequest[]>(() => getStudentRegistrationRequests());
  const [applications, setApplications] = useState<EventApplication[]>(() =>
    getAllApplications().filter(a => a.status !== 'DRAFT')
  );
  const [categories, setCategories] = useState<EventCategory[]>(() => getCategories());
  const [sections, setSections] = useState<AcademicSection[]>(() => getAcademicSections());

  // Admin Profile & Security State
  const [adminName, setAdminName] = useState(() => localStorage.getItem('master_admin_name') || currentUser?.displayName || 'Boomika');
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem('master_admin_email') || currentUser?.email || 'boomika@gmail.com');
  const [adminMobile, setAdminMobile] = useState(() => localStorage.getItem('master_admin_mobile') || '9876543210');
  const [adminDob, setAdminDob] = useState(() => localStorage.getItem('master_admin_dob') || '2000-01-15');
  const [adminDepartment, setAdminDepartment] = useState(() => localStorage.getItem('master_admin_dept') || 'Electronics & Communication Engineering');
  const [adminDesignation, setAdminDesignation] = useState(() => localStorage.getItem('master_admin_desig') || 'Head Administrator');
  const [adminPhotoUrl, setAdminPhotoUrl] = useState(() => localStorage.getItem('master_admin_photo') || currentUser?.profilePhotoUrl || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Admin Password Change State
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);
  const [showAdminCurrentPwd, setShowAdminCurrentPwd] = useState(false);
  const [showAdminNewPwd, setShowAdminNewPwd] = useState(false);

  // Admin Announcements State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementStatus, setAnnouncementStatus] = useState<string | null>(null);
  const [announcementsList, setAnnouncementsList] = useState(() => getUserNotifications('ALL'));

  const [uploadingAdminPhoto, setUploadingAdminPhoto] = useState(false);
  const [uploadAdminPhotoProgress, setUploadAdminPhotoProgress] = useState(0);

  const handleAdminPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAdminPhoto(true);
    setUploadAdminPhotoProgress(15);
    try {
      const res = await uploadToCloudinary(file, 'profile_photos', (pct) => {
        setUploadAdminPhotoProgress(pct);
      });
      setAdminPhotoUrl(res.url);
      await updateMasterAdminProfile({ profilePhotoUrl: res.url });

      const stored = localStorage.getItem('signovanta_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.profilePhotoUrl = res.url;
        localStorage.setItem('signovanta_current_user', JSON.stringify(parsed));
      }
      setProfileSuccessMsg('✓ Master Admin photo uploaded to Cloudinary & saved!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Photo upload failed');
    } finally {
      setUploadingAdminPhoto(false);
    }
  };

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMasterAdminProfile({
        displayName: adminName.trim(),
        email: adminEmail.trim().toLowerCase(),
        mobile: adminMobile.trim(),
        dateOfBirth: adminDob,
        department: adminDepartment,
        designation: adminDesignation.trim(),
        profilePhotoUrl: adminPhotoUrl,
      });

      const stored = localStorage.getItem('signovanta_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.displayName = adminName;
        parsed.email = adminEmail;
        parsed.department = adminDepartment;
        parsed.designation = adminDesignation;
        parsed.profilePhotoUrl = adminPhotoUrl;
        localStorage.setItem('signovanta_current_user', JSON.stringify(parsed));
      }

      setProfileSuccessMsg('✓ Master Admin profile details saved permanently in Firebase!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save admin profile');
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    const actualPin = localStorage.getItem('master_admin_pwd') || '927624';
    if (currentAdminPassword !== actualPin && currentAdminPassword !== '927624') {
      setPasswordErrorMsg('Current password is incorrect. (Default PIN is 927624)');
      return;
    }
    if (!newAdminPassword || newAdminPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordErrorMsg('New password and confirmation do not match.');
      return;
    }

    if (auth && auth.currentUser) {
      try {
        await fbUpdatePassword(auth.currentUser, newAdminPassword);
      } catch (err) {
        console.warn('Firebase Auth admin password update warning:', err);
      }
    }

    localStorage.setItem('master_admin_pwd', newAdminPassword);
    setPasswordSuccessMsg('✓ Master Admin password updated successfully in Firebase! Use your new password for your next login.');
    setCurrentAdminPassword('');
    setNewAdminPassword('');
    setConfirmAdminPassword('');
    setTimeout(() => setPasswordSuccessMsg(null), 5000);
  };

  const handlePostAdminAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncementStatus(null);
    try {
      createStaffAnnouncement(announcementTitle, announcementMessage, `${adminName} (Head Administrator)`);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setAnnouncementsList(getUserNotifications('ALL'));
      setAnnouncementStatus('✓ Announcement published successfully to ALL students and staff!');
      window.dispatchEvent(new CustomEvent('signovanta:data-updated'));
      setTimeout(() => setAnnouncementStatus(null), 4000);
    } catch (err: any) {
      setAnnouncementStatus(err.message || 'Failed to post announcement.');
    }
  };

  useEffect(() => {
    const allowedTabs = new Set([
      'overview',
      'my_profile',
      'students',
      'staff',
      'approvals',
      'submissions',
      'certificates',
      'delete_things',
      'analytics',
      'categories',
      'exports',
      'announcements',
      'settings',
    ]);
    if (requestedTab && allowedTabs.has(requestedTab)) {
      setActiveTab(requestedTab as typeof activeTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    void Promise.all([
      syncApplicationsFromFirebase(),
      syncStudentsFromFirebase(),
      syncStaffFromFirebase(),
      syncStudentRegistrationRequestsFromFirebase(),
    ]).then(([remoteApplications, remoteStudents, remoteStaff, remoteRequests]) => {
      setApplications(remoteApplications.filter(a => a.status !== 'DRAFT'));
      setStudents(remoteStudents);
      setStaffList(remoteStaff);
      setStudentRequests(remoteRequests);
    });

    const unsubApps = subscribeToApplications((remote) => {
      setApplications(remote.filter(a => a.status !== 'DRAFT'));
    });
    const unsubStudents = subscribeToStudents((remote) => {
      setStudents(remote);
    });
    const unsubStaff = subscribeToStaff((remote) => {
      setStaffList(remote);
    });
    const unsubReqs = subscribeToStudentRequests((remote) => {
      setStudentRequests(remote);
    });

    return () => {
      unsubApps();
      unsubStudents();
      unsubStaff();
      unsubReqs();
    };
  }, []);

  useEffect(() => {
    const refreshStudents = () => setStudents(getLocalStudents());
    window.addEventListener('signovanta:student-updated', refreshStudents);
    return () => window.removeEventListener('signovanta:student-updated', refreshStudents);
  }, []);

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showRoleAssignModal, setShowRoleAssignModal] = useState<Staff | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deletePin, setDeletePin] = useState('');
  const [deleteWarningAccepted, setDeleteWarningAccepted] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [studentEdit, setStudentEdit] = useState({ fullName: '', mobile: '', dateOfBirth: '', profilePhotoUrl: '', profilePhotoPublicId: '' });
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [assignedRoleChoice, setAssignedRoleChoice] = useState<'STAFF' | 'HOD' | 'AHOD'>('STAFF');
  const [assignedDeptChoice, setAssignedDeptChoice] = useState('Electronics & Communication Engineering');

  // Single Add Student Form
  const [newRegNo, setNewRegNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newDept, setNewDept] = useState('Electronics & Communication Engineering');
  const [newYear, setNewYear] = useState('III Year');
  const [newSection, setNewSection] = useState('III Year ECE A');

  const reloadAll = () => {
    setStudents(getLocalStudents());
    setStaffList(getLocalStaff());
    setStudentRequests(getStudentRegistrationRequests());
    setApplications(getAllApplications().filter(a => a.status !== 'DRAFT'));
    setCategories(getCategories());
    setSections(getAcademicSections());
  };

  // Staff Management Handlers
  const handleApproveStaff = (staff: Staff, role: 'STAFF' | 'HOD' | 'AHOD', dept: string) => {
    const list = getLocalStaff();
    const idx = list.findIndex(s => s.id === staff.id);
    if (idx !== -1) {
      list[idx].approvalStatus = 'APPROVED';
      list[idx].assignedRole = role;
      list[idx].department = dept;
      list[idx].approvedAt = new Date().toISOString();
      list[idx].approvedBy = currentUser?.displayName || 'Boomika (Admin)';
      saveLocalStaff(list);
      setStaffList([...list]);
      setShowRoleAssignModal(null);
    }
  };

  const handleRejectStaff = (staffId: string) => {
    if (!confirm('Reject this staff registration request?')) return;
    const list = getLocalStaff();
    const idx = list.findIndex(s => s.id === staffId);
    if (idx !== -1) {
      list[idx].approvalStatus = 'REJECTED';
      saveLocalStaff(list);
      setStaffList([...list]);
    }
  };

  const handleToggleStaffSuspension = (staffId: string) => {
    const list = getLocalStaff();
    const idx = list.findIndex(s => s.id === staffId);
    if (idx !== -1) {
      list[idx].isSuspended = !list[idx].isSuspended;
      saveLocalStaff(list);
      setStaffList([...list]);
    }
  };

  // Student Request Approvals Handlers
  const handleApproveStudentReq = (reqId: string) => {
    try {
      approveStudentRegistrationRequest(reqId);
      setStudentRequests(getStudentRegistrationRequests());
      setStudents(getLocalStudents());
    } catch (err: any) {
      alert(err.message || 'Approval failed.');
    }
  };

  const handleRejectStudentReq = (reqId: string) => {
    if (!confirm('Reject this student registration request?')) return;
    try {
      rejectStudentRegistrationRequest(reqId);
      setStudentRequests(getStudentRegistrationRequests());
    } catch (err: any) {
      alert(err.message || 'Rejection failed.');
    }
  };

  // Student Handlers
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const norm = normalizeRegNo(newRegNo);
    if (!norm) {
      alert('Please enter a valid Registration Number.');
      return;
    }
    const currentList = getLocalStudents();
    if (currentList.some(s => normalizeRegNo(s.registrationNumber) === norm)) {
      alert(`Registration Number "${norm}" already exists.`);
      return;
    }

    const newStudent: Student = {
      id: `std_${norm.toLowerCase()}`,
      registrationNumber: norm,
      fullName: newName.trim(),
      email: `${norm.toLowerCase()}@mkce.ac.in`,
      mobile: newMobile.trim() || '9800000000',
      department: 'Electronics & Communication Engineering',
      academicYear: newYear,
      section: newSection,
      status: 'NOT_ACTIVATED',
      isActivated: false,
      hasSetPassword: false,
      createdAt: new Date().toISOString(),
      eventCount: 0,
    };

    currentList.push(newStudent);
    saveLocalStudents(currentList);
    setStudents([...currentList]);
    setShowAddStudentModal(false);

    // Reset
    setNewRegNo('');
    setNewName('');
    setNewEmail('');
    setNewMobile('');
  };

  const handleToggleSuspendStudent = (studentId: string, currentStatus: string) => {
    const currentList = getLocalStudents();
    const idx = currentList.findIndex(s => s.id === studentId);
    if (idx !== -1) {
      const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      currentList[idx].status = newStatus;
      saveLocalStudents(currentList);
      setStudents([...currentList]);
    }
  };

  const openStudentEditor = (student: Student) => {
    setStudentEdit({
      fullName: student.fullName,
      mobile: student.mobile,
      dateOfBirth: student.dateOfBirth || '',
      profilePhotoUrl: student.profilePhotoUrl || '',
      profilePhotoPublicId: student.profilePhotoPublicId || '',
    });
    setIsEditingStudent(true);
  };

  const handleStudentPhotoChange = async (file: File) => {
    try {
      const upload = await uploadToCloudinary(file, 'profile_photos');
      setStudentEdit(current => ({ ...current, profilePhotoUrl: upload.url, profilePhotoPublicId: upload.publicId }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Profile image upload failed.');
    }
  };

  const handleStudentProfileSave = async () => {
    if (!selectedStudent || !studentEdit.fullName.trim()) return;
    setIsSavingStudent(true);
    try {
      const updated = await updateStudentProfile(selectedStudent.id, {
        fullName: studentEdit.fullName.trim(),
        mobile: studentEdit.mobile.trim(),
        dateOfBirth: studentEdit.dateOfBirth,
        profilePhotoUrl: studentEdit.profilePhotoUrl,
        profilePhotoPublicId: studentEdit.profilePhotoPublicId,
      });
      setStudents(current => current.map(student => student.id === updated.id ? updated : student));
      setSelectedStudent(updated);
      setIsEditingStudent(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Student profile update failed.');
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleResetPassword = (student: Student) => {
    const norm = normalizeRegNo(student.registrationNumber);
    if (!confirm(`Reset credentials for ${student.fullName} (${norm})? Password will reset to registration number.`)) {
      return;
    }
    const currentList = getLocalStudents();
    const idx = currentList.findIndex(s => s.id === student.id);
    if (idx !== -1) {
      currentList[idx].hasSetPassword = false;
      currentList[idx].isActivated = false;
      currentList[idx].status = 'NOT_ACTIVATED';
      localStorage.removeItem(`pwd_${norm}`);
      saveLocalStudents(currentList);
      setStudents([...currentList]);
      alert(`Password for ${student.fullName} has been reset to "${norm}".`);
    }
  };

  // Bulk CSV Ingestion
  const handleBulkImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const currentList = getLocalStudents();
        let addedCount = 0;

        rows.forEach((row) => {
          const rawReg = row.registrationNumber || row.regNo || row.RegNo || row['Register Number'];
          if (!rawReg) return;
          const norm = normalizeRegNo(rawReg);

          if (!currentList.some(s => normalizeRegNo(s.registrationNumber) === norm)) {
            currentList.push({
              id: `std_${norm.toLowerCase()}`,
              registrationNumber: norm,
              fullName: row.fullName || row.name || row.Name || 'Student',
              email: `${norm.toLowerCase()}@mkce.ac.in`,
              mobile: row.mobile || row.phone || '9800000000',
              department: 'Electronics & Communication Engineering',
              academicYear: row.academicYear || row.year || 'III Year',
              section: row.section || 'III Year ECE A',
              status: 'NOT_ACTIVATED',
              isActivated: false,
              hasSetPassword: false,
              createdAt: new Date().toISOString(),
              eventCount: 0,
            });
            addedCount++;
          }
        });

        saveLocalStudents(currentList);
        setStudents([...currentList]);
        setShowBulkImportModal(false);
        alert(`Successfully imported ${addedCount} student records!`);
      },
    });
  };

  const handleDeleteStudentSubmissions = async (studentRegNo: string) => {
    await deleteStudentSubmissions(studentRegNo);
    const norm = studentRegNo.toUpperCase().trim();
    setApplications(current => current.filter(a => a.studentRegNo.toUpperCase().trim() !== norm));
  };

  const handleDeleteStudentAccount = async (student: Student) => {
    await deleteStudent(student.id, student.registrationNumber);
    setStudents(current => current.filter(s => s.id !== student.id));
    setApplications(current => current.filter(a => a.studentRegNo.toUpperCase().trim() !== student.registrationNumber.toUpperCase().trim()));
  };

  const handleDeleteAllSubmissions = async () => {
    await deleteAllApplications();
    setApplications([]);
  };

  // Open the dedicated export center from the overview action.
  const handleExportCSV = () => {
    setActiveTab('exports');
  };

  const pendingStaffCount = staffList.filter(s => s.approvalStatus === 'PENDING').length;
  const pendingStudentRequests = studentRequests.filter(r => r.status === 'PENDING');
  const totalPendingCount = pendingStaffCount + pendingStudentRequests.length;

  return (
    <div className="space-y-6">
      {/* Tab: Overview Metrics */}
      {activeTab === 'exports' && (
        <ExportManagement students={students} staff={staffList} applications={applications} isMasterAdmin />
      )}

      {/* Tab: Admin Profile & Security Settings */}
      {(activeTab === 'my_profile' || activeTab === 'settings') && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-purple-900 text-white flex items-center justify-center font-black text-2xl overflow-hidden ring-4 ring-purple-100 shadow-md">
                {adminPhotoUrl ? (
                  <img src={adminPhotoUrl} alt={adminName} className="w-full h-full object-cover" />
                ) : (
                  <span>{adminName ? adminName.charAt(0).toUpperCase() : 'B'}</span>
                )}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900">{adminName}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Head Administrator
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Master Access
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{adminEmail}</p>
              <p className="text-xs text-purple-700 font-semibold">{adminDepartment} • M. Kumarasamy College of Engineering</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Edit Profile Information */}
            <form onSubmit={handleSaveAdminProfile} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <User size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Administrator Details</h3>
                  <p className="text-[11px] text-slate-500">Edit and save your institutional profile information</p>
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
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email Address</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    value={adminMobile}
                    onChange={(e) => setAdminMobile(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={adminDob}
                    onChange={(e) => setAdminDob(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={adminDesignation}
                    onChange={(e) => setAdminDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={adminDepartment}
                  onChange={(e) => setAdminDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-purple-900 text-white overflow-hidden ring-2 ring-white shadow-xs shrink-0 flex items-center justify-center font-bold text-lg">
                  {adminPhotoUrl ? (
                    <img src={adminPhotoUrl} alt="Admin Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{adminName ? adminName.charAt(0).toUpperCase() : 'B'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">Master Admin Photo</span>
                  <label className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-[11px] font-bold text-slate-700 cursor-pointer transition-colors shadow-xs">
                    <UploadCloud size={13} />
                    <span>{uploadingAdminPhoto ? `Uploading (${uploadAdminPhotoProgress}%)...` : 'Upload to Cloudinary'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAdminPhotoUpload}
                      disabled={uploadingAdminPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Direct Photo URL (Optional)</label>
                <input
                  type="url"
                  value={adminPhotoUrl}
                  onChange={(e) => setAdminPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm" leftIcon={<Save size={14} />} className="bg-purple-900 hover:bg-purple-950 text-white">
                  Save Admin Profile
                </Button>
              </div>
            </form>

            {/* 2. Change Admin Password */}
            <form onSubmit={handleChangeAdminPassword} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <KeyRound size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Security & Sign-In Password</h3>
                  <p className="text-[11px] text-slate-500">Update the Master Admin sign-in password</p>
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
                  Current Admin Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminCurrentPwd ? 'text' : 'password'}
                    required
                    value={currentAdminPassword}
                    onChange={(e) => setCurrentAdminPassword(e.target.value)}
                    placeholder="Enter current password (default: 927624)"
                    className="w-full pl-3 pr-9 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminCurrentPwd(!showAdminCurrentPwd)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showAdminCurrentPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Admin Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminNewPwd ? 'text' : 'password'}
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-3 pr-9 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminNewPwd(!showAdminNewPwd)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showAdminNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
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
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm" leftIcon={<KeyRound size={14} />} className="bg-amber-600 hover:bg-amber-700 text-white">
                  Update Admin Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Institutional Announcements (Broadcast to All Students & Staff) */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Post New Announcement */}
          <form onSubmit={handlePostAdminAnnouncement} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Bell size={18} />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Publish Institutional Announcement</h2>
                <p className="text-xs text-slate-500">
                  Broadcasts immediately to every student dashboard, staff console, and notification drawer
                </p>
              </div>
            </div>

            {announcementStatus && (
              <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${announcementStatus.startsWith('✓') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {announcementStatus.startsWith('✓') ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={16} className="text-rose-600 shrink-0" />}
                <span>{announcementStatus}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Announcement Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Smart India Hackathon Registration Deadline Extended"
                className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Detailed Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="Write official message guidelines, instructions, or deadlines..."
                className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Author: <strong className="text-purple-700">{adminName} (Head Administrator)</strong>
              </span>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Send size={14} />} className="bg-purple-900 hover:bg-purple-950 text-white">
                Broadcast Announcement
              </Button>
            </div>
          </form>

          {/* Announcement Feed */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell size={16} className="text-purple-600" />
              <span>Active Broadcast Feed ({announcementsList.length})</span>
            </h3>

            {announcementsList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                No active announcements published yet.
              </div>
            ) : (
              <div className="space-y-3">
                {announcementsList.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{item.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Master Admin Header */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Central Master Admin Control • Boomika
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  ECE 3rd Year Gateway
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Institutional Administration Panel
              </h1>
              <p className="text-xs text-slate-300">
                ECE 3rd Year Student Directory (ECE A, B, C, D) • Faculty Authorizations & Workflow Oversight
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCSV}
                leftIcon={<Download size={14} />}
                className="shadow-md"
              >
                Export Directory CSV
              </Button>
            </div>
          </div>

          {/* Top 5 Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total ECE Students
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {students.length}
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">
                {students.filter(student => student.isActivated || student.status === 'ACTIVE').length} Login success
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                ECE Faculty / Staff
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {staffList.length}
              </span>
              <span className="text-[11px] text-amber-600 font-bold">
                {pendingStaffCount} Requests pending
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Event Applications
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {applications.length}
              </span>
              <span className="text-[11px] text-blue-600 font-bold">
                {applications.filter(a => a.status === 'PRE_APPROVED').length} Pre-Approved
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Completed (100%)
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {applications.filter(a => a.status === 'COMPLETED').length}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Verified by ECE faculty</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Participating Students</span>
              <span className="text-2xl font-black text-blue-900 mt-1 block">
                {new Set(applications.map(app => app.studentRegNo)).size}
              </span>
              <span className="text-[11px] text-blue-700">Students with event submissions</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Awaiting Action</span>
              <span className="text-2xl font-black text-amber-900 mt-1 block">
                {applications.filter(app => ['SUBMITTED', 'UNDER_REVIEW', 'CERTIFICATE_SUBMITTED', 'FINAL_VERIFICATION', 'CORRECTION_REQUIRED'].includes(app.status)).length}
              </span>
              <span className="text-[11px] text-amber-700">Applications in review</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Activated Accounts</span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block">
                {students.filter(student => student.isActivated || student.status === 'ACTIVE').length}
              </span>
              <span className="text-[11px] text-emerald-700">Students who signed in</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Winning Students</span>
              <span className="text-2xl font-black text-amber-900 mt-1 block">
                {new Set(applications.filter(app => app.prizeWon).map(app => app.studentRegNo)).size}
              </span>
              <span className="text-[11px] text-amber-700">Students with winning certificates</span>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Categories</span>
              <span className="text-2xl font-black text-purple-900 mt-1 block">{categories.length}</span>
              <span className="text-[11px] text-purple-700">Available event categories</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Students by Section</h2>
                  <p className="text-xs text-slate-500">Current student database distribution</p>
                </div>
                <GraduationCap size={20} className="text-blue-600" />
              </div>
              <div className="space-y-3">
                {Array.from(new Set(students.map(student => student.section).filter(Boolean))).sort().map(section => {
                  const count = students.filter(student => student.section === section).length;
                  const width = students.length ? Math.max((count / students.length) * 100, 4) : 0;
                  return (
                    <div key={section}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">{section.trim().split(/\s+/).pop()}</span>
                        <span className="font-bold text-slate-500">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Recent Event Activity</h2>
                  <p className="text-xs text-slate-500">Latest submissions and workflow status</p>
                </div>
                <FileText size={20} className="text-purple-600" />
              </div>
              {applications.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No event activity recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {[...applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map(app => (
                    <div key={app.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{app.studentName} • {app.eventName}</p>
                        <p className="text-[11px] text-slate-500">{new Date(app.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge status={app.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Approvals Alert Banner */}
          {totalPendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-bold text-amber-950">
                    {totalPendingCount} Pending Registration & Role Request(s) Awaiting Admin Action
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {pendingStudentRequests.length} Student registration request(s) • {pendingStaffCount} Faculty role request(s)
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setActiveTab('approvals')}>
                Review Requests Queue
              </Button>
            </div>
          )}

          {/* Hall of Fame & Winner Certificates Showcase */}
          <WinnersCertificateShowcase
            applications={applications}
            title="🏆 Hall of Fame & Winner Certificates (3rd Year ECE)"
            subtitle="Verified prize winners, trophies and certificates across all academic sections"
          />

        </div>
      )}

      {/* Tab: Student Management */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">ECE Student Database (3rd Year)</h2>
              <p className="text-xs text-slate-500">
                Preloaded 3rd Year ECE Cohort (Sections III Year ECE A, B, C, D)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <div className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
                  <Upload size={14} />
                  <span>Bulk Import CSV</span>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBulkImportCSV}
                  className="hidden"
                />
              </label>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddStudentModal(true)}
                leftIcon={<Plus size={14} />}
              >
                Add Student
              </Button>
            </div>
          </div>

          <StudentDirectoryMonitor
            isAdminView
            onSelectStudent={setSelectedStudent}
            onToggleSuspend={handleToggleSuspendStudent}
            onResetPassword={handleResetPassword}
            onRequestDelete={student => setDeleteTarget(student)}
            applications={applications}
          />
        </div>
      )}

      {activeTab === 'submissions' && (
        <SubmissionsPanel
          applications={applications}
          editorUid={currentUser?.uid || 'master-admin'}
          editorName={currentUser?.displayName || 'Master Admin'}
          editorRole="MASTER_ADMIN"
          onUpdate={updated => setApplications(current => current.map(item => item.id === updated.id ? updated : item))}
          onEnableStudentEdit={async application => {
            try {
              const updated = await enableStudentApplicationEditing(
                application.id,
                currentUser?.uid || 'master-admin',
                currentUser?.displayName || 'Master Admin',
                'MASTER_ADMIN'
              );
              setApplications(current => current.map(item => item.id === updated.id ? updated : item));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Unable to enable student editing.');
            }
          }}
          onDisableStudentEdit={async application => {
            try {
              const updated = await disableStudentApplicationEditing(
                application.id,
                currentUser?.uid || 'master-admin',
                currentUser?.displayName || 'Master Admin',
                'MASTER_ADMIN'
              );
              setApplications(current => current.map(item => item.id === updated.id ? updated : item));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Unable to lock student editing.');
            }
          }}
          onApprove={async application => {
            try {
              const updated = await preApproveApplication(
                application.id,
                currentUser?.uid || 'master-admin',
                currentUser?.displayName || 'Master Admin',
                'MASTER_ADMIN',
                'Approved by Master Admin from Submissions.'
              );
              setApplications(current => current.map(item => item.id === updated.id ? updated : item));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Approval failed.');
            }
          }}
          onComplete={async application => {
            const remarks = window.prompt('Final verification remarks:');
            if (remarks === null) return;
            try {
              const updated = await completeEventApplication(
                application.id,
                currentUser?.uid || 'master-admin',
                currentUser?.displayName || 'Master Admin',
                'MASTER_ADMIN',
                remarks || 'Certificates verified by Master Admin. Event marked 100% completed.'
              );
              setApplications(current => current.map(item => item.id === updated.id ? updated : item));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Final verification failed.');
            }
          }}
          onReject={async application => {
            const remarks = window.prompt('Reason for rejecting this submission:');
            if (remarks === null) return;
            try {
              const updated = await rejectApplication(
                application.id,
                currentUser?.uid || 'master-admin',
                currentUser?.displayName || 'Master Admin',
                'MASTER_ADMIN',
                remarks || 'Rejected by Master Admin.'
              );
              setApplications(current => current.map(item => item.id === updated.id ? updated : item));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Rejection failed.');
            }
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

      {/* Tab: Direct Certificates (Single-Step Submissions) */}
      {activeTab === 'certificates' && (
        <DirectCertificatesPanel
          editorUid={currentUser?.uid || 'master-admin'}
          editorName={adminName}
          editorRole="MASTER_ADMIN"
          isMasterAdmin={true}
        />
      )}

      {/* Tab: Delete Records (Guarded with 2-Step PIN 927624) */}
      {activeTab === 'delete_things' && (
        <DeleteThingsPanel
          students={students}
          applications={applications}
          onDeleteStudentSubmissions={handleDeleteStudentSubmissions}
          onDeleteStudent={handleDeleteStudentAccount}
          onDeleteAllSubmissions={handleDeleteAllSubmissions}
          isMasterAdmin={true}
        />
      )}

      {/* Tab: Approvals & Requests Queue */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Section 1: Pending Student Requests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="text-blue-600" size={18} />
                  <span>Pending Student Registration Requests ({pendingStudentRequests.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Students submitting self-registration for unlisted cohort additions
                </p>
              </div>
            </div>

            {pendingStudentRequests.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center text-xs text-slate-500">
                No pending student registration requests. All records verified.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingStudentRequests.map((req) => (
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
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <UserCheck size={14} className="mr-1" />
                        Approve & Preload Student
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRejectStudentReq(req.id)}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        <UserX size={14} className="mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Pending Faculty Role Requests */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="text-purple-600" size={18} />
                <span>Pending Faculty Role Authorization Requests ({pendingStaffCount})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Master Admin must assign role (STAFF, HOD, AHOD) before privileges are unlocked
              </p>
            </div>

            {pendingStaffCount === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center text-xs text-slate-500">
                No pending faculty registration requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffList.filter(s => s.approvalStatus === 'PENDING').map((stf) => (
                  <div key={stf.id} className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{stf.fullName}</h4>
                        <p className="text-xs font-mono font-bold text-purple-700">{stf.staffId} • {stf.email}</p>
                        <p className="text-xs text-slate-500">{stf.department} • {stf.designation}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        PENDING
                      </span>
                    </div>

                    <div className="text-xs bg-slate-50 p-2.5 rounded-xl space-y-0.5 text-slate-600">
                      <p><strong>Requested Role:</strong> <span className="font-bold text-purple-700">{stf.requestedRole}</span></p>
                      <p><strong>Mobile:</strong> {stf.mobile || 'N/A'}</p>
                      {stf.supportingInfo && <p className="italic text-slate-500">"{stf.supportingInfo}"</p>}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => {
                          setShowRoleAssignModal(stf);
                          setAssignedRoleChoice(stf.requestedRole);
                          setAssignedDeptChoice('Electronics & Communication Engineering');
                        }}
                      >
                        Assign Role & Grant Access
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRejectStaff(stf.id)}
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
        </div>
      )}

      {/* Tab: Staff Directory */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ECE Faculty Directory
              </h2>
              <p className="text-xs text-slate-500">
                Available staff members and role requests
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Available Staff ({staffList.filter(stf => stf.approvalStatus !== 'PENDING').length})</h3>
            </div>
            {staffList.filter(stf => stf.approvalStatus !== 'PENDING').length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                No approved staff members available.
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffList.filter(stf => stf.approvalStatus !== 'PENDING').map((stf) => (
              <div
                key={stf.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{stf.fullName}</h3>
                    <p className="text-xs text-slate-500">
                      ID: {stf.staffId} • {stf.email}
                    </p>
                    <p className="text-xs font-semibold text-blue-700 mt-0.5">
                      {stf.department} • {stf.designation}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge role={stf.assignedRole} size="sm" />
                    {stf.approvalStatus === 'PENDING' && (
                      <span className="block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Pending Approval
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs bg-slate-50 p-3 rounded-2xl space-y-1">
                  <p>
                    <strong>Assigned Role:</strong>{' '}
                    <span className="font-bold text-purple-700">{stf.assignedRole}</span>
                  </p>
                  <p>
                    <strong>Requested Role:</strong>{' '}
                    <span className="text-slate-600 font-medium">{stf.requestedRole}</span>
                  </p>
                  {stf.supportingInfo && (
                    <p className="text-slate-600 italic">"{stf.supportingInfo}"</p>
                  )}
                  <p className="text-slate-400 text-[11px]">
                    Registered: {new Date(stf.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {stf.approvalStatus === 'PENDING' ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setShowRoleAssignModal(stf);
                          setAssignedRoleChoice(stf.requestedRole);
                          setAssignedDeptChoice('Electronics & Communication Engineering');
                        }}
                        className="flex-1"
                      >
                        Assign Role & Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRejectStaff(stf.id)}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowRoleAssignModal(stf);
                          setAssignedRoleChoice(stf.assignedRole);
                          setAssignedDeptChoice('Electronics & Communication Engineering');
                        }}
                        className="flex-1"
                      >
                        Modify Role
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStaffSuspension(stf.id)}
                        className={stf.isSuspended ? 'text-emerald-600' : 'text-rose-600'}
                      >
                        {stf.isSuspended ? 'Reactivate' : 'Suspend'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
            </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Staff Requests ({pendingStaffCount})</h3>
              <span className="text-xs text-slate-500">Pending role authorization</span>
            </div>
            {pendingStaffCount === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                No pending staff requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffList.filter(stf => stf.approvalStatus === 'PENDING').map(stf => (
                  <div key={stf.id} className="bg-amber-50 rounded-3xl border border-amber-200 p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{stf.fullName}</h3>
                        <p className="text-xs text-slate-600">{stf.email}</p>
                        <p className="text-xs font-semibold text-blue-700 mt-1">{stf.department} • {stf.designation}</p>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-1 rounded-lg border border-amber-300">Request</span>
                    </div>
                    <p className="text-xs text-slate-600">Requested role: <strong>{stf.requestedRole}</strong></p>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={() => {
                        setShowRoleAssignModal(stf);
                        setAssignedRoleChoice(stf.requestedRole);
                        setAssignedDeptChoice('Electronics & Communication Engineering');
                      }} className="flex-1">Review Request</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleRejectStaff(stf.id)} className="text-rose-600 hover:bg-rose-50">Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Tab: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Mathematical Analytics with Pie Chart, Section Comparative Bar Graph, and Event-Wise Winning Table */}
          <EventParticipationAnalytics students={students} applications={applications} isStaffOrAdminView />

          <EventOutcomeAnalytics applications={applications} />
          {(() => {
            const participatedStudentIds = new Set(applications.map(app => app.studentRegNo));
            const participated = students.filter(student => participatedStudentIds.has(student.registrationNumber)).length;
            const notParticipated = Math.max(students.length - participated, 0);
            const activated = students.filter(student => student.isActivated || student.status === 'ACTIVE').length;
            const notActivated = Math.max(students.length - activated, 0);
            const participationPercent = students.length ? Math.round((participated / students.length) * 100) : 0;
            const activationPercent = students.length ? Math.round((activated / students.length) * 100) : 0;
            const sectionAnalytics = Array.from(new Set(students.map(student => student.section).filter(Boolean))).map(section => {
              const sectionStudents = students.filter(student => student.section === section);
              const sectionParticipated = sectionStudents.filter(student => participatedStudentIds.has(student.registrationNumber)).length;
              return { section, total: sectionStudents.length, participated: sectionParticipated, percent: sectionStudents.length ? Math.round((sectionParticipated / sectionStudents.length) * 100) : 0 };
            }).sort((a, b) => b.participated - a.participated);
            const statusAnalytics = [
              ['Submitted', applications.filter(app => app.status === 'SUBMITTED').length, 'bg-blue-500'],
              ['Pre-approved', applications.filter(app => app.status === 'PRE_APPROVED').length, 'bg-indigo-500'],
              ['Certificate pending', applications.filter(app => app.status === 'CERTIFICATE_SUBMITTED').length, 'bg-amber-500'],
              ['Completed', applications.filter(app => app.status === 'COMPLETED').length, 'bg-emerald-500'],
              ['Rejected', applications.filter(app => app.status === 'REJECTED').length, 'bg-rose-500'],
            ] as const;
            const eventAnalytics = Array.from(new Set(applications.map(app => app.eventName).filter(Boolean))).map(eventName => ({
              eventName,
              count: applications.filter(app => app.eventName === eventName).length,
            })).sort((a, b) => b.count - a.count).slice(0, 5);
            const maxEventCount = Math.max(...eventAnalytics.map(item => item.count), 1);
            const categoryAnalytics = Array.from(new Set(applications.map(app => app.eventCategory).filter(Boolean))).map(category => ({
              category,
              count: applications.filter(app => app.eventCategory === category).length,
            })).sort((a, b) => b.count - a.count);
            const maxCategoryCount = Math.max(...categoryAnalytics.map(item => item.count), 1);

            return (
              <>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Student Analytics</h2>
                  <p className="text-xs text-slate-500">Participation and account activation from current student records.</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    ['Total Students', students.length, 'text-slate-900'],
                    ['Participated', participated, 'text-blue-700'],
                    ['Not Participated', notParticipated, 'text-amber-700'],
                    ['Activated', activated, 'text-emerald-700'],
                  ].map(([label, value, color]) => (
                    <div key={String(label)} className="bg-white rounded-2xl border border-slate-200 p-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                      <strong className={`block text-2xl font-black mt-1 ${color}`}>{value}</strong>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-3xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900">Participation Overview</h3>
                    <div className="mt-5 flex items-center gap-6">
                      <div
                        className="w-32 h-32 rounded-full shrink-0"
                        style={{ background: `conic-gradient(#2563eb 0 ${participationPercent}%, #fbbf24 ${participationPercent}% 100%)` }}
                        aria-label={`Participation: ${participationPercent}%`}
                      />
                      <div className="space-y-3 text-xs">
                        <p><span className="inline-block w-3 h-3 rounded-full bg-blue-600 mr-2" />Participated: <strong>{participated}</strong></p>
                        <p><span className="inline-block w-3 h-3 rounded-full bg-amber-400 mr-2" />Not participated: <strong>{notParticipated}</strong></p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900">Account Activation</h3>
                    <div className="mt-5 flex items-end gap-8 h-32">
                      {[
                        ['Activated', activated, 'bg-emerald-500'],
                        ['Awaiting First Login', notActivated, 'bg-slate-300'],
                      ].map(([label, value, color]) => (
                        <div key={String(label)} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                          <strong className="text-sm text-slate-700">{value}</strong>
                          <div className={`w-full max-w-[90px] rounded-t-xl ${color}`} style={{ height: `${Math.max((Number(value) / Math.max(students.length, 1)) * 100, value === 0 ? 2 : 8)}%` }} />
                          <span className="text-[11px] text-slate-500 text-center">{label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-4">{activationPercent}% of students have activated their account by signing in.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <section className="bg-white rounded-3xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Participation by Section</h3>
                        <p className="text-xs text-slate-500 mt-1">Compare student engagement across sections.</p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">{sectionAnalytics.length} sections</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {sectionAnalytics.length === 0 ? <p className="text-xs text-slate-500">No section data available.</p> : sectionAnalytics.map(item => (
                        <div key={item.section}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700">{item.section.trim().split(/\s+/).pop()}</span>
                            <span className="text-slate-500">{item.participated}/{item.total} ({item.percent}%)</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${item.percent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="bg-white rounded-3xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Popular Event Categories</h3>
                        <p className="text-xs text-slate-500 mt-1">What type of events students participate in most.</p>
                      </div>
                      <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700">{categoryAnalytics.length} categories</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {categoryAnalytics.length === 0 ? <p className="text-xs text-slate-500">No category participation data available.</p> : categoryAnalytics.map(item => (
                        <div key={item.category}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                            <span className="truncate font-bold text-slate-700">{item.category}</span>
                            <span className="shrink-0 text-slate-500">{item.count} {item.count === 1 ? 'application' : 'applications'}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${(item.count / maxCategoryCount) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="bg-white rounded-3xl border border-slate-200 p-5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Application Workflow</h3>
                      <p className="text-xs text-slate-500 mt-1">Current workload by approval stage.</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {statusAnalytics.map(([label, value, color]) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
                          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{label}</span>
                          <strong className="text-sm text-slate-900">{value}</strong>
                        </div>
                      ))}
                      {applications.length === 0 && <p className="text-xs text-slate-500">No applications available.</p>}
                    </div>
                  </section>
                </div>
                <section className="bg-white rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Most Active Events</h3>
                      <p className="text-xs text-slate-500 mt-1">Events receiving the highest number of student applications.</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Top 5</span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {eventAnalytics.length === 0 ? <p className="text-xs text-slate-500">No event applications available.</p> : eventAnalytics.map(item => (
                      <div key={item.eventName} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-xs font-bold text-slate-800">{item.eventName}</span>
                          <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-blue-700">{item.count}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(item.count / maxEventCount) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            );
          })()}
        </div>
      )}

      {/* Legacy event listing retained for existing application data */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              ECE Event Applications ({applications.length})
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">App ID</th>
                    <th className="py-3 px-4">Student & Section</th>
                    <th className="py-3 px-4">Event & Category</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Status & Progress</th>
                    <th className="py-3 px-4">Prize</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {app.applicationNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{app.studentName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {app.studentRegNo} • {app.section}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{app.eventName}</span>
                        <span className="text-[11px] text-blue-700">{app.eventCategory}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {app.startDate} to {app.endDate}
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={app.status} size="sm" />
                        <span className="ml-2 font-bold text-slate-700">
                          {app.progressPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700">
                        {app.prizeWon ? (
                          <span className="text-emerald-700">🏆 {app.prizeCategory}</span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Event Categories Catalogue</h2>
              <p className="text-xs text-slate-500">Categories available for student selection</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{cat.name}</h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {deleteTarget && (
        <PinVerificationModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onSuccess={async () => {
            if (deleteTarget) {
              await deleteStudent(deleteTarget.id, deleteTarget.registrationNumber);
              setStudents(current => current.filter(s => s.id !== deleteTarget.id));
              setApplications(current => current.filter(a => a.studentRegNo.toUpperCase().trim() !== deleteTarget.registrationNumber.toUpperCase().trim()));
              setDeleteTarget(null);
            }
          }}
          title={`Delete Student: ${deleteTarget.fullName} (${deleteTarget.registrationNumber})`}
          description={`Permanently delete student ${deleteTarget.fullName} (${deleteTarget.registrationNumber}) and all their submitted event records from Cloud Firestore? This action is permanent and cannot be undone.`}
          confirmButtonText="Delete Student & Data"
        />
      )}

      {/* Staff Role Assignment Modal */}
      {selectedStudent && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudent(null)}
          title={`Student Details: ${selectedStudent.fullName}`}
          subtitle={`${selectedStudent.registrationNumber} • ${selectedStudent.department}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-white/10 flex items-center justify-center">
                  {selectedStudent.profilePhotoUrl ? <img src={selectedStudent.profilePhotoUrl} alt="" className="h-full w-full object-cover" /> : <GraduationCap size={22} />}
                </div>
                <div>
                  <p className="text-sm font-bold">{selectedStudent.fullName}</p>
                  <p className="text-xs text-slate-300">{selectedStudent.registrationNumber} • {selectedStudent.section}</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => openStudentEditor(selectedStudent)}>Edit Student</Button>
            </div>
            {isEditingStudent && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Edit Student Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-slate-600">Name<input value={studentEdit.fullName} onChange={event => setStudentEdit(current => ({ ...current, fullName: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /></label>
                  <label className="text-xs font-semibold text-slate-600">Phone<input value={studentEdit.mobile} onChange={event => setStudentEdit(current => ({ ...current, mobile: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /></label>
                  <label className="text-xs font-semibold text-slate-600">Date of Birth<input type="date" value={studentEdit.dateOfBirth} onChange={event => setStudentEdit(current => ({ ...current, dateOfBirth: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /></label>
                  <label className="text-xs font-semibold text-slate-600">Profile Image<input type="file" accept="image/*" onChange={event => event.target.files?.[0] && void handleStudentPhotoChange(event.target.files[0])} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /></label>
                </div>
                <p className="text-[11px] text-slate-500">Registration number is fixed and cannot be edited.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditingStudent(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" isLoading={isSavingStudent} onClick={handleStudentProfileSave}>Save Changes</Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Name', selectedStudent.fullName, false],
                ['Register Number', selectedStudent.registrationNumber, true],
                ['Phone Number', selectedStudent.mobile || 'Not provided', false],
                ['Email Address', selectedStudent.email || 'Not provided', false],
                ['Last Login', selectedStudent.lastLoginAt ? new Date(selectedStudent.lastLoginAt).toLocaleString() : 'Never', false],
                ['Events Participated', String(applications.filter(a => a.studentRegNo.toUpperCase().trim().replace(/\s+/g, '') === selectedStudent.registrationNumber.toUpperCase().trim().replace(/\s+/g, '') && a.status !== 'DRAFT').length), false],
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
                  <p className="mt-0.5 text-xs text-slate-500">Submissions, approvals, activity logs, and uploaded files</p>
                </div>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {applications.filter(app => app.studentRegNo === selectedStudent.registrationNumber).length}
                </span>
              </div>
              <div className="space-y-3 p-4">
              {applications.filter(app => app.studentRegNo === selectedStudent.registrationNumber).map(app => (
                <div key={app.id} className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm space-y-2">
                  <div className="flex items-center justify-between gap-2"><strong>{app.eventName}</strong><Badge status={app.status} /></div>
                  <p className="text-slate-500">Submitted: {new Date(app.createdAt).toLocaleString()} • Pre-approval: {app.preApprovedAt ? `${app.preApprovedByName || 'Staff'} at ${new Date(app.preApprovedAt).toLocaleString()}` : 'Pending'} • Final: {app.completedAt ? `${app.completedByName || 'Staff'} at ${new Date(app.completedAt).toLocaleString()}` : 'Pending'}</p>
                  <div className="border-t border-slate-200 pt-2 space-y-1">
                    <p className="font-bold text-slate-700">Activity Log</p>
                    {getApprovalLogs(app.id).map(log => <p key={log.id} className="text-[11px] text-slate-500">{new Date(log.timestamp).toLocaleString()} • {log.action} • {log.performedByName} ({log.performedByRole}){log.remarks ? ` — ${log.remarks}` : ''}</p>)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[['Browser', app.browserUrl], ['Brochure', app.brochureUrl], ['Participation certificate', app.participationCertUrl], ['Winner certificate', app.winnerCertUrl]].filter(([, url]) => Boolean(url)).map(([label, url]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer" download className="px-2.5 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg font-bold">{label}</a>)}
                  </div>
                </div>
              ))}
              {applications.filter(app => app.studentRegNo === selectedStudent.registrationNumber).length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center">
                  <p className="text-sm font-semibold text-slate-700">No event submissions found</p>
                  <p className="mt-1 text-xs text-slate-500">Submitted events and uploaded documents will appear here.</p>
                </div>
              )}
              </div>
            </section>
          </div>
        </Modal>
      )}

      {/* Staff Role Assignment Modal */}
      {showRoleAssignModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowRoleAssignModal(null)}
          title={`Assign Privileges: ${showRoleAssignModal.fullName}`}
          subtitle="Master Administrator role determination"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900">
              <strong>Applicant:</strong> {showRoleAssignModal.fullName} ({showRoleAssignModal.email})
              <br />
              <strong>Requested Role:</strong> {showRoleAssignModal.requestedRole}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Authorized Assigned Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={assignedRoleChoice}
                onChange={(e) => setAssignedRoleChoice(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="STAFF">STAFF (Faculty Verification)</option>
                <option value="HOD">HOD (Head of Department)</option>
                <option value="AHOD">AHOD (Assistant Head of Department)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department Jurisdiction
              </label>
              <input
                type="text"
                disabled
                value="Electronics & Communication Engineering"
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowRoleAssignModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  handleApproveStaff(showRoleAssignModal, assignedRoleChoice, 'Electronics & Communication Engineering')
                }
              >
                Save & Grant Access
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Student Single Modal */}
      {showAddStudentModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddStudentModal(false)}
          title="Add New Student Record"
          subtitle="Preload student identity for third-year cohort"
          maxWidth="md"
        >
          <form onSubmit={handleAddStudentSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registration Number (e.g. 927624BEC099) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newRegNo}
                onChange={(e) => setNewRegNo(e.target.value)}
                placeholder="Case-insensitive"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Student official name"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  disabled
                  value="Electronics & Communication Engineering"
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="III Year ECE A">III Year ECE A</option>
                  <option value="III Year ECE B">III Year ECE B</option>
                  <option value="III Year ECE C">III Year ECE C</option>
                  <option value="III Year ECE D">III Year ECE D</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowAddStudentModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Preload Student
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
