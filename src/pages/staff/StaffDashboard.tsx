import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EventApplication, Student, UserRole } from '../../types';
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
  deleteApplication,
} from '../../services/firebase/firestoreService';
import { ExportManagement } from '../../components/common/ExportManagement';
import { SubmissionsPanel } from '../../components/common/SubmissionsPanel';
import { DeleteThingsPanel } from '../../components/common/DeleteThingsPanel';
import { EventOutcomeAnalytics } from '../../components/common/EventOutcomeAnalytics';
import { WinnersCertificateShowcase } from '../../components/analytics/WinnersCertificateShowcase';
import { EventParticipationAnalytics } from '../../components/analytics/EventParticipationAnalytics';
import { getLocalStudents, syncStudentsFromFirebase } from '../../services/firebase/authService';
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
} from 'lucide-react';

interface StaffDashboardProps {
  activeTab?: string;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ activeTab: requestedTab }) => {
  const { currentUser, staffData } = useAuth();
  const [activeTab, setActiveTab] = useState<'approvals' | 'certificates' | 'announcements' | 'exports' | 'analytics' | 'submissions' | 'delete_things'>('approvals');
  const [applications, setApplications] = useState<EventApplication[]>(() => getAllApplications());
  const [students, setStudents] = useState(() => getLocalStudents());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementStatus, setAnnouncementStatus] = useState<string | null>(null);

  useEffect(() => {
    const tabMap: Record<string, typeof activeTab> = {
      pre_approvals: 'approvals',
      certificate_verification: 'certificates',
      delete_things: 'delete_things',
      submissions: 'submissions',
      announcements: 'announcements',
      exports: 'exports',
      analytics: 'analytics',
    };
    if (requestedTab && tabMap[requestedTab]) setActiveTab(tabMap[requestedTab]);
  }, [requestedTab]);

  useEffect(() => {
    void Promise.all([syncApplicationsFromFirebase(), syncStudentsFromFirebase()])
      .then(([remoteApplications, remoteStudents]) => {
        setApplications(remoteApplications);
        setStudents(remoteStudents);
      });
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
    setApplications(getAllApplications());
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
      createStaffAnnouncement(announcementTitle, announcementMessage, currentUser.displayName);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setAnnouncementStatus('Announcement posted. It is now visible in every student notification center.');
    } catch (err) {
      setAnnouncementStatus(err instanceof Error ? err.message : 'Failed to post announcement.');
    }
  };

  const announcements = getUserNotifications('ALL');

  return (
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

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              ['Students', students.length, 'bg-blue-600'],
              ['Pre-Approval Queue', preApprovalQueue.length, 'bg-amber-500'],
              ['Certificates to Verify', certificateVerificationQueue.length, 'bg-purple-600'],
              ['Completed', completedList.length, 'bg-emerald-600'],
              ['Winning Students', new Set(applications.filter(app => app.prizeWon).map(app => app.studentRegNo)).size, 'bg-amber-600'],
            ].map(([label, value, color]) => (
              <div key={String(label)} className={`${color} rounded-2xl p-4 text-white shadow-sm`}>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">{label}</span>
                <strong className="block text-2xl font-black mt-1">{value}</strong>
                <span className="text-[11px] text-white/80">Live database count</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1.5 rounded-full font-bold">
              ✓ Active Authenticated Session
            </span>
          </div>
        </div>
      </div>

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

      {/* Tab 1: Pre-Approval Queue (50% stage) */}
      {activeTab === 'approvals' && (
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

      {/* Tab 2: Certificate Verification (100% stage) */}
      {activeTab === 'certificates' && (
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

      {/* Tab: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <EventParticipationAnalytics students={students} applications={applications} isStaffOrAdminView />
          <EventOutcomeAnalytics applications={applications} />
        </div>
      )}

      {activeTab === 'delete_things' && (
        <DeleteThingsPanel students={students} staff={[]} />
      )}

      {activeTab === 'submissions' && (
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
