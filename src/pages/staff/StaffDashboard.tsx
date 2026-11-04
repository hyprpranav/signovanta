import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EventApplication, UserRole } from '../../types';
import {
  getAllApplications,
  preApproveApplication,
  completeEventApplication,
  requestCorrectionApplication,
  rejectApplication,
} from '../../services/firebase/firestoreService';
import { StudentDirectoryMonitor } from '../../components/monitoring/StudentDirectoryMonitor';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Modal } from '../../components/common/Modal';
import {
  CheckSquare,
  FileCheck,
  Radio,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Users,
  Search,
  Filter,
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { currentUser, staffData } = useAuth();
  const [activeTab, setActiveTab] = useState<'approvals' | 'certificates' | 'directory'>('approvals');
  const [applications, setApplications] = useState<EventApplication[]>(() => getAllApplications());

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

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1.5 rounded-full font-bold">
              ✓ Active Authenticated Session
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-xl">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'approvals'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare size={15} />
          <span>Pre-Approvals ({preApprovalQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'certificates'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck size={15} />
          <span>Verify Certificates ({certificateVerificationQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'directory'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Radio size={15} className="text-emerald-500 animate-pulse" />
          <span>Live Presence</span>
        </button>
      </div>

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
        </div>
      )}

      {/* Tab 3: Real-time Student Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Department Student Directory</h2>
              <p className="text-xs text-slate-500">Live presence, login history, and event metrics</p>
            </div>
          </div>
          <StudentDirectoryMonitor isAdminView={false} />
        </div>
      )}

      {/* Review Confirmation Modal */}
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

