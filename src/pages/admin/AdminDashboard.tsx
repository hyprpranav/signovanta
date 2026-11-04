import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePresence } from '../../context/PresenceContext';
import {
  Student,
  Staff,
  EventApplication,
  EventCategory,
  AcademicSection,
} from '../../types';
import {
  getLocalStudents,
  saveLocalStudents,
  getLocalStaff,
  saveLocalStaff,
  normalizeRegNo,
} from '../../services/firebase/authService';
import {
  getAllApplications,
  saveAllApplications,
  getCategories,
  saveCategories,
  getAcademicSections,
  saveAcademicSections,
  getApprovalLogs,
} from '../../services/firebase/firestoreService';
import { StudentDirectoryMonitor } from '../../components/monitoring/StudentDirectoryMonitor';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  ShieldAlert,
  Users,
  Briefcase,
  FileText,
  Radio,
  BarChart3,
  CheckCircle2,
  XCircle,
  Plus,
  Upload,
  Download,
  AlertTriangle,
  Key,
  ShieldCheck,
  Search,
} from 'lucide-react';
import Papa from 'papaparse';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { summary } = usePresence();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'students' | 'staff' | 'events' | 'categories' | 'analytics' | 'audit'
  >('overview');

  const [students, setStudents] = useState<Student[]>(() => getLocalStudents());
  const [staffList, setStaffList] = useState<Staff[]>(() => getLocalStaff());
  const [applications, setApplications] = useState<EventApplication[]>(() => getAllApplications());
  const [categories, setCategories] = useState<EventCategory[]>(() => getCategories());
  const [sections, setSections] = useState<AcademicSection[]>(() => getAcademicSections());
  const auditLogs = getApprovalLogs();

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showRoleAssignModal, setShowRoleAssignModal] = useState<Staff | null>(null);
  const [assignedRoleChoice, setAssignedRoleChoice] = useState<'STAFF' | 'HOD' | 'AHOD'>('STAFF');
  const [assignedDeptChoice, setAssignedDeptChoice] = useState('Electronics & Communication');

  // Single Add Student Form
  const [newRegNo, setNewRegNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newDept, setNewDept] = useState('Electronics & Communication');
  const [newYear, setNewYear] = useState('III Year');
  const [newSection, setNewSection] = useState('III Year V Section');

  const reloadAll = () => {
    setStudents(getLocalStudents());
    setStaffList(getLocalStaff());
    setApplications(getAllApplications());
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
      list[idx].approvedBy = currentUser?.displayName;
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
      email: newEmail.trim() || `${norm.toLowerCase()}@college.edu`,
      mobile: newMobile.trim() || '9800000000',
      department: newDept,
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

  const handleResetPassword = (student: Student) => {
    const norm = normalizeRegNo(student.registrationNumber);
    if (confirm(`Reset password for ${student.fullName} (${norm}) back to their Registration Number?`)) {
      localStorage.removeItem(`pwd_${norm}`);
      const currentList = getLocalStudents();
      const idx = currentList.findIndex(s => s.id === student.id);
      if (idx !== -1) {
        currentList[idx].hasSetPassword = false;
        currentList[idx].isActivated = false;
        currentList[idx].status = 'NOT_ACTIVATED';
        saveLocalStudents(currentList);
        setStudents([...currentList]);
        alert(`Password for ${norm} has been reset to: ${norm}`);
      }
    }
  };

  // CSV Bulk Import
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
              email: row.email || `${norm.toLowerCase()}@college.edu`,
              mobile: row.mobile || row.phone || '9800000000',
              department: row.department || row.dept || 'Engineering',
              academicYear: row.academicYear || row.year || 'III Year',
              section: row.section || 'III Year V Section',
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

  // Export to CSV
  const handleExportCSV = () => {
    const csv = Papa.unparse(
      students.map(s => ({
        RegistrationNumber: s.registrationNumber,
        FullName: s.fullName,
        Department: s.department,
        AcademicYear: s.academicYear,
        Section: s.section,
        Email: s.email,
        Mobile: s.mobile,
        Status: s.status,
        Activated: s.isActivated ? 'YES' : 'NO',
        EventCount: s.eventCount,
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `signovanta_students_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingStaffCount = staffList.filter(s => s.approvalStatus === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Master Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              Central Master Admin Control
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
              Full System Access
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Institutional Administration Panel
          </h1>
          <p className="text-xs text-slate-300">
            Student preloads, privileged staff authorization, workflow oversight, and analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download size={14} />}
            className="text-white border-white/20 hover:bg-white/10"
          >
            Export Directory CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'students' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Students ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-all relative ${
            activeTab === 'staff' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Staff & Roles
          {pendingStaffCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-rose-600 text-white text-[10px] rounded-full font-bold">
              {pendingStaffCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'events' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Events ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'categories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* Tab: Overview Metrics */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Top 5 Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Students
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {summary.total}
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">
                {summary.online} Online right now
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Staff
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
              <span className="text-[11px] text-slate-500 font-medium">Verified by faculty</span>
            </div>
          </div>

          {/* Pending Staff Requests Banner */}
          {pendingStaffCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-bold text-amber-950">
                    {pendingStaffCount} New Staff Registration Request(s) Awaiting Role Assignment
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Remember: User-requested roles must never be automatically granted. Master Admin must assign roles (STAFF, HOD, AHOD).
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setActiveTab('staff')}>
                Review Requests
              </Button>
            </div>
          )}

          {/* Live Presence Table */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">Live Presence Directory</h2>
            <StudentDirectoryMonitor
              isAdminView
              onToggleSuspend={handleToggleSuspendStudent}
              onResetPassword={handleResetPassword}
            />
          </div>
        </div>
      )}

      {/* Tab: Student Management */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Database & Preloads</h2>
              <p className="text-xs text-slate-500">
                Preloaded Third-Year Cohorts (Sections V, A, C) • Bulk CSV Ingestion
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
            onToggleSuspend={handleToggleSuspendStudent}
            onResetPassword={handleResetPassword}
          />
        </div>
      )}

      {/* Tab: Staff & Role Requests */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Staff Directory & Privilege Authorization
              </h2>
              <p className="text-xs text-slate-500">
                Assign STAFF, HOD, or AHOD permissions upon verification
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffList.map((stf) => (
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
                    <strong>Requested Role:</strong>{' '}
                    <span className="font-bold text-purple-700">{stf.requestedRole}</span>
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
                          setAssignedDeptChoice(stf.department);
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
                          setAssignedDeptChoice(stf.department);
                        }}
                        className="flex-1"
                      >
                        Modify Role / Dept
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
        </div>
      )}

      {/* Tab: Events */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              All Event Applications ({applications.length})
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

      {/* Tab: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">Tamper-Proof Audit Trail</h2>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">App ID</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-blue-700">{log.applicationNumber}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{log.action}</td>
                      <td className="py-2.5 px-4 text-slate-700">{log.performedByName}</td>
                      <td className="py-2.5 px-4">
                        <Badge role={log.performedByRole} size="sm" />
                      </td>
                      <td className="py-2.5 px-4 font-sans text-xs text-slate-600">
                        {log.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showRoleAssignModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowRoleAssignModal(null)}
          title="Privileged Role Assignment"
          subtitle={`Assign official permissions to ${showRoleAssignModal.fullName} (${showRoleAssignModal.staffId})`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
              <strong>Security Protocol:</strong> Requested Role was{' '}
              <span className="font-bold text-purple-700">{showRoleAssignModal.requestedRole}</span>.
              Confirm or adjust the final granted role below.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Role <span className="text-rose-500">*</span>
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
              <select
                value={assignedDeptChoice}
                onChange={(e) => setAssignedDeptChoice(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
              >
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowRoleAssignModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  handleApproveStaff(showRoleAssignModal, assignedRoleChoice, assignedDeptChoice)
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
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="Electronics & Communication">ECE</option>
                  <option value="Computer Science & Engineering">CSE</option>
                  <option value="Civil Engineering">Civil</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="III Year V Section">III Year V Section</option>
                  <option value="III Year A Section">III Year A Section</option>
                  <option value="III Year C Section">III Year C Section</option>
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

