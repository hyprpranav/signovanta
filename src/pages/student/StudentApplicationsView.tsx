import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EventApplication } from '../../types';
import { getApplicationsForStudent, getApprovalLogs } from '../../services/firebase/firestoreService';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Modal } from '../../components/common/Modal';
import { PostEventSubmissionModal } from './PostEventSubmissionModal';
import {
  FileText,
  Calendar,
  MapPin,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  Clock,
  History,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface StudentApplicationsViewProps {
  onNewEvent: () => void;
}

export const StudentApplicationsView: React.FC<StudentApplicationsViewProps> = ({
  onNewEvent,
}) => {
  const { studentData } = useAuth();
  if (!studentData) return null;

  const [applications, setApplications] = useState<EventApplication[]>(() =>
    getApplicationsForStudent(studentData.registrationNumber)
  );

  const [filter, setFilter] = useState<string>('ALL');
  const [selectedAppForAudit, setSelectedAppForAudit] = useState<EventApplication | null>(null);
  const [selectedAppForPostEvent, setSelectedAppForPostEvent] = useState<EventApplication | null>(null);

  const reload = () => {
    setApplications(getApplicationsForStudent(studentData.registrationNumber));
  };

  const filteredApps = applications.filter((app) => {
    if (filter === 'ALL') return true;
    if (filter === 'PRE_APPROVED') return app.status === 'PRE_APPROVED';
    if (filter === 'COMPLETED') return app.status === 'COMPLETED';
    if (filter === 'PENDING')
      return ['SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'CERTIFICATE_SUBMITTED'].includes(
        app.status
      );
    if (filter === 'REJECTED') return app.status === 'REJECTED';
    return true;
  });

  const auditHistory = selectedAppForAudit ? getApprovalLogs(selectedAppForAudit.id) : [];

  return (
    <div className="space-y-6">
      {/* Header and Add Event button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Event Applications & Approvals</h1>
          <p className="text-xs text-slate-500">
            Track multi-tier verification status, reviewer remarks, and submit post-event certificates
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onNewEvent} leftIcon={<Plus size={16} />}>
          New Event Application
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl max-w-lg overflow-x-auto">
        {['ALL', 'PRE_APPROVED', 'COMPLETED', 'PENDING', 'REJECTED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-all ${
              filter === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {f === 'ALL'
              ? 'All'
              : f === 'PRE_APPROVED'
              ? 'Pre-Approved (50%)'
              : f === 'COMPLETED'
              ? 'Completed (100%)'
              : f === 'PENDING'
              ? 'Pending'
              : 'Rejected'}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApps.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
            <FileText size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No Applications Found</p>
            <p className="text-xs text-slate-500 mt-1">
              You do not have any applications matching the selected filter.
            </p>
          </div>
        ) : (
          filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {app.applicationNumber}
                    </span>
                    <span className="text-xs font-bold text-blue-700">{app.eventCategory}</span>
                    <span className="text-[11px] text-slate-400">• {app.eventMode}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{app.eventName}</h3>
                  <p className="text-xs text-slate-500">
                    {app.organizerName} • {app.institutionName} ({app.eventLocation})
                  </p>
                </div>
                <div>
                  <Badge status={app.status} />
                </div>
              </div>

              {/* Progress Stepper Bar */}
              <ProgressBar
                status={app.status}
                progressPercent={app.progressPercent}
                preApprovedBy={app.preApprovedByName}
                preApprovedAt={app.preApprovedAt}
                completedAt={app.completedAt}
              />

              {/* Pre-Approval Reviewer Details if granted */}
              {app.preApprovedBy && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-blue-950 font-bold">
                    <span>Pre-Approved By: {app.preApprovedByName} ({app.preApprovedRole})</span>
                    <span className="text-slate-400 font-normal">
                      {app.preApprovedAt ? new Date(app.preApprovedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  {app.preApprovalRemarks && (
                    <p className="text-blue-900 italic">"{app.preApprovalRemarks}"</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedAppForAudit(app)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <History size={14} />
                  <span>View Complete Approval History</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* If Pre-approved, show post-event submission button */}
                  {app.status === 'PRE_APPROVED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedAppForPostEvent(app)}
                      leftIcon={<UploadCloud size={14} />}
                    >
                      Submit Post-Event Certificates
                    </Button>
                  )}

                  {app.status === 'COMPLETED' && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                      <CheckCircle2 size={14} /> Verified 100% Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Audit History Modal */}
      {selectedAppForAudit && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAppForAudit(null)}
          title="Official Verification & Approval History"
          subtitle={`Application: ${selectedAppForAudit.applicationNumber} - ${selectedAppForAudit.eventName}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {auditHistory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No intermediate audit log entries recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {auditHistory.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-blue-600" />
                        {log.action}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      <strong>Reviewed By:</strong> {log.performedByName} (
                      <span className="font-bold text-blue-700">{log.performedByRole}</span>)
                    </p>
                    {log.remarks && (
                      <p className="text-slate-700 italic bg-white p-2 rounded-xl border border-slate-200">
                        "{log.remarks}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Post Event Certificate Submission Modal */}
      {selectedAppForPostEvent && (
        <PostEventSubmissionModal
          isOpen={true}
          onClose={() => setSelectedAppForPostEvent(null)}
          application={selectedAppForPostEvent}
          onSuccess={() => {
            reload();
            setSelectedAppForPostEvent(null);
          }}
        />
      )}
    </div>
  );
};

