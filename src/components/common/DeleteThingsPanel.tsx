import React, { useMemo, useState } from 'react';
import { AlertTriangle, KeyRound, Search, Trash2, User, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Student, EventApplication } from '../../types';
import { PinVerificationModal } from './PinVerificationModal';
import { Button } from './Button';

interface DeleteThingsPanelProps {
  students: Student[];
  applications: EventApplication[];
  onDeleteStudentSubmissions: (studentRegNo: string) => Promise<void>;
  onDeleteStudent: (student: Student) => Promise<void>;
  onDeleteAllSubmissions?: () => Promise<void>;
  isMasterAdmin?: boolean;
}

export const DeleteThingsPanel: React.FC<DeleteThingsPanelProps> = ({
  students,
  applications,
  onDeleteStudentSubmissions,
  onDeleteStudent,
  onDeleteAllSubmissions,
  isMasterAdmin = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentRegNo, setSelectedStudentRegNo] = useState<string>('');
  
  // Modal target state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'STUDENT_SUBMISSIONS' | 'STUDENT_ACCOUNT' | 'ALL_SUBMISSIONS';
    student?: Student;
    regNo?: string;
  } | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Selected student entity
  const selectedStudent = useMemo(() => {
    if (!selectedStudentRegNo) return null;
    return students.find(s => s.registrationNumber.toUpperCase().trim() === selectedStudentRegNo.toUpperCase().trim()) || null;
  }, [students, selectedStudentRegNo]);

  // Selected student's applications
  const selectedStudentApps = useMemo(() => {
    if (!selectedStudentRegNo) return [];
    return applications.filter(a => a.studentRegNo.toUpperCase().trim() === selectedStudentRegNo.toUpperCase().trim() && a.status !== 'DRAFT');
  }, [applications, selectedStudentRegNo]);

  // Filtered students for quick table
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students.slice(0, 15);
    const q = searchQuery.toLowerCase().trim();
    return students.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.registrationNumber.toLowerCase().includes(q) ||
      s.section.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [students, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-rose-50 p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-rose-600 p-3 text-white shadow-md shrink-0">
            <ShieldAlert size={26} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-rose-950">
              Administrative Deletion & Data Purge Center
            </h2>
            <p className="text-xs text-rose-800 leading-relaxed max-w-3xl">
              Permanently delete student event submissions or student records directly from Cloud Firestore and the institutional directory.
              All destructive operations require <strong>2-step verification and Master Security PIN authorization</strong>.
            </p>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Grid: Select & Delete */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Select & Delete Student Event Submissions */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select & Delete Student Event Submissions</h3>
              <p className="text-[11px] text-slate-500">Target a student by Register Number to wipe their submitted event data</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Choose or Enter Student Register Number
            </label>
            <select
              value={selectedStudentRegNo}
              onChange={(e) => setSelectedStudentRegNo(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">-- Choose Student by Register Number --</option>
              {students.map(s => {
                const count = applications.filter(a => a.studentRegNo.toUpperCase().trim() === s.registrationNumber.toUpperCase().trim() && a.status !== 'DRAFT').length;
                return (
                  <option key={s.id} value={s.registrationNumber}>
                    {s.registrationNumber} • {s.fullName} ({s.section}) — [{count} events submitted]
                  </option>
                );
              })}
            </select>
          </div>

          {selectedStudent && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{selectedStudent.fullName}</h4>
                  <p className="text-[11px] font-mono text-blue-700 font-bold">{selectedStudent.registrationNumber} • {selectedStudent.section}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
                  {selectedStudentApps.length} Event Submissions
                </span>
              </div>

              {selectedStudentApps.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedStudentApps.map(app => (
                    <div key={app.id} className="text-[11px] p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-slate-800 truncate">{app.eventName}</span>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{app.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">This student has 0 active event submissions.</p>
              )}

              <Button
                variant="primary"
                size="sm"
                disabled={selectedStudentApps.length === 0}
                onClick={() => setDeleteTarget({ type: 'STUDENT_SUBMISSIONS', student: selectedStudent, regNo: selectedStudent.registrationNumber })}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                leftIcon={<Trash2 size={14} />}
              >
                Delete All Submissions for {selectedStudent.registrationNumber}
              </Button>
            </div>
          )}
        </div>

        {/* Card 2: Student Account Deletion & Purge */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-700">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Delete Student Record</h3>
              <p className="text-[11px] text-slate-500">Permanently delete a student's institutional account & access</p>
            </div>
          </div>

          {selectedStudent ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-rose-950">Target Account: {selectedStudent.fullName}</h4>
                <p className="text-[11px] font-mono text-rose-800 mt-0.5">
                  Reg No: {selectedStudent.registrationNumber} | Email: {selectedStudent.email}
                </p>
                <p className="text-[11px] text-rose-700 mt-1">
                  Deleting this student will remove their profile and all linked submissions permanently from Firestore.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setDeleteTarget({ type: 'STUDENT_ACCOUNT', student: selectedStudent, regNo: selectedStudent.registrationNumber })}
                className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold cursor-pointer"
                leftIcon={<Trash2 size={14} />}
              >
                Delete Student ({selectedStudent.registrationNumber})
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              Select a student from the dropdown or directory below to enable account deletion.
            </div>
          )}

          {/* Master Admin All Submissions Purge */}
          {isMasterAdmin && onDeleteAllSubmissions && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Global Reset (Master Admin Only)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget({ type: 'ALL_SUBMISSIONS' })}
                className="w-full border-rose-300 text-rose-800 hover:bg-rose-50 font-bold cursor-pointer"
                leftIcon={<AlertTriangle size={14} className="text-rose-600" />}
              >
                Purge All Event Submissions ({applications.length} Records)
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Student Directory Table with Direct Delete Buttons */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Student Directory Management</h3>
            <p className="text-[11px] text-slate-500">Quickly find students to wipe their event data or remove accounts</p>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or reg no..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Register No</th>
                <th className="py-2.5 px-3">Section</th>
                <th className="py-2.5 px-3">Events</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(student => {
                const count = applications.filter(a => a.studentRegNo.toUpperCase().trim() === student.registrationNumber.toUpperCase().trim() && a.status !== 'DRAFT').length;
                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{student.fullName}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{student.registrationNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600">{student.section}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                          {count} events
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentRegNo(student.registrationNumber);
                          setDeleteTarget({ type: 'STUDENT_SUBMISSIONS', student, regNo: student.registrationNumber });
                        }}
                        disabled={count === 0}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-40 cursor-pointer"
                        title="Delete this student's event submissions"
                      >
                        Delete Events
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentRegNo(student.registrationNumber);
                          setDeleteTarget({ type: 'STUDENT_ACCOUNT', student, regNo: student.registrationNumber });
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Delete this student record"
                      >
                        Delete Student
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Step Secret PIN Verification Modal */}
      <PinVerificationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={async () => {
          if (!deleteTarget) return;

          if (deleteTarget.type === 'STUDENT_SUBMISSIONS' && deleteTarget.regNo) {
            await onDeleteStudentSubmissions(deleteTarget.regNo);
            showNotification(`✓ All event submissions for ${deleteTarget.regNo} deleted successfully.`);
          } else if (deleteTarget.type === 'STUDENT_ACCOUNT' && deleteTarget.student) {
            await onDeleteStudent(deleteTarget.student);
            showNotification(`✓ Student record for ${deleteTarget.student.fullName} (${deleteTarget.student.registrationNumber}) deleted.`);
          } else if (deleteTarget.type === 'ALL_SUBMISSIONS' && onDeleteAllSubmissions) {
            await onDeleteAllSubmissions();
            showNotification(`✓ All event submissions purged successfully.`);
          }
          setDeleteTarget(null);
        }}
        title={
          deleteTarget?.type === 'STUDENT_SUBMISSIONS'
            ? `Delete Event Submissions: ${deleteTarget.student?.fullName || deleteTarget.regNo}`
            : deleteTarget?.type === 'STUDENT_ACCOUNT'
            ? `Delete Student Record: ${deleteTarget.student?.fullName} (${deleteTarget.regNo})`
            : 'Purge All Event Submissions'
        }
        description={
          deleteTarget?.type === 'STUDENT_SUBMISSIONS'
            ? `Are you sure you want to permanently delete all submitted event records for ${deleteTarget.student?.fullName || deleteTarget.regNo}? All applications and certificates will be removed from Cloud Firestore.`
            : deleteTarget?.type === 'STUDENT_ACCOUNT'
            ? `Are you sure you want to permanently delete the student account for ${deleteTarget.student?.fullName} (${deleteTarget.regNo})? The student will no longer be able to log in.`
            : `Are you sure you want to permanently purge all ${applications.length} event submissions in the entire database?`
        }
        confirmButtonText={
          deleteTarget?.type === 'STUDENT_SUBMISSIONS'
            ? 'Delete All Submissions'
            : deleteTarget?.type === 'STUDENT_ACCOUNT'
            ? 'Delete Student Record'
            : 'Purge All Submissions'
        }
      />
    </div>
  );
};
