import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EventApplication } from '../../types';
import { getApplicationsForStudent, getApprovalLogs, deleteApplication } from '../../services/firebase/firestoreService';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Modal } from '../../components/common/Modal';
import { PostEventSubmissionModal } from './PostEventSubmissionModal';
import { ApplicationEditModal } from '../../components/common/ApplicationEditModal';
import {
  FileText,
  Calendar,
  MapPin,
  Globe,
  UploadCloud,
  CheckCircle2,
  Clock,
  History,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';

interface StudentApplicationsViewProps {
  onNewEvent: () => void;
  onEditDraft?: (app: EventApplication) => void;
}

export const StudentApplicationsView: React.FC<StudentApplicationsViewProps> = ({
  onNewEvent,
  onEditDraft,
}) => {
  const { currentUser, studentData } = useAuth();
  if (!studentData) return null;

  const [applications, setApplications] = useState<EventApplication[]>(() =>
    getApplicationsForStudent(studentData.registrationNumber)
  );

  const [filter, setFilter] = useState<string>('ALL');
  const [selectedAppForAudit, setSelectedAppForAudit] = useState<EventApplication | null>(null);
  const [selectedAppForPostEvent, setSelectedAppForPostEvent] = useState<EventApplication | null>(null);
  const [selectedAppForEdit, setSelectedAppForEdit] = useState<EventApplication | null>(null);

  const reload = () => {
    setApplications(getApplicationsForStudent(studentData.registrationNumber));
  };

  const draftCount = applications.filter(a => a.status === 'DRAFT').length;

  const handleDeleteDraft = async (id: string) => {
    if (window.confirm('Are you sure you want to discard this draft application?')) {
      try {
        await deleteApplication(id);
        reload();
      } catch (err: any) {
        alert(err.message || 'Failed to delete draft.');
      }
    }
  };

  const filteredApps = applications.filter((app) => {
    if (filter === 'ALL') return true;
    if (filter === 'DRAFT') return app.status === 'DRAFT';
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
      <div className="flex bg-slate-100 p-1 rounded-2xl max-w-2xl overflow-x-auto gap-1">
        {['ALL', 'DRAFT', 'PRE_APPROVED', 'COMPLETED', 'PENDING', 'REJECTED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              filter === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>
              {f === 'ALL'
                ? 'All'
                : f === 'DRAFT'
                ? 'Drafts'
                : f === 'PRE_APPROVED'
                ? 'Pre-Approved (50%)'
                : f === 'COMPLETED'
                ? 'Completed (100%)'
                : f === 'PENDING'
                ? 'Pending'
                : 'Rejected'}
            </span>
            {f === 'DRAFT' && draftCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                filter === 'DRAFT' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {draftCount}
              </span>
            )}
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

              {/* Saved Draft Notification Banner */}
              {app.status === 'DRAFT' && (
                <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                    <div>
                      <span className="font-bold block text-sm">Saved Draft Application</span>
                      <span className="text-[11px] text-amber-800">
                        This event is saved in your private drafts. It is NOT sent to staff or admin until you click submit.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onEditDraft && onEditDraft(app)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-xs"
                      leftIcon={<Pencil size={14} />}
                    >
                      Open Draft & Continue Editing
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(app.id)}
                      className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                      title="Discard Draft"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-3">
                <p>
                  <span className="block font-bold uppercase tracking-wide text-slate-400">Submitted</span>
                  <span className="font-medium text-slate-700">{new Date(app.createdAt).toLocaleString()}</span>
                </p>
                <p>
                  <span className="block font-bold uppercase tracking-wide text-slate-400">50% approved</span>
                  <span className="font-medium text-slate-700">{app.preApprovedAt ? new Date(app.preApprovedAt).toLocaleString() : 'Pending'}</span>
                </p>
                <p>
                  <span className="block font-bold uppercase tracking-wide text-slate-400">100% submitted</span>
                  <span className="font-medium text-slate-700">{app.postEventSubmittedAt ? new Date(app.postEventSubmittedAt).toLocaleString() : 'Pending'}</span>
                </p>
              </div>

              {app.status === 'CERTIFICATE_SUBMITTED' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <Clock size={18} className="mt-0.5 shrink-0 text-amber-700" />
                  <div>
                    <p className="text-sm font-bold text-amber-950">
                      100% verification is awaiting Admin/Staff approval
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      Your post-event details and certificates have been submitted successfully.
                      Please contact the Admin or Staff if the final verification is still pending.
                    </p>
                  </div>
                </div>
              )}
              {app.status === 'COMPLETED' && (
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-950">
                    {app.studentEditEnabledAt ? 'Student editing has been enabled for this event' : 'Editing is disabled by default after 100% approval'}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-amber-900">
                    {app.studentEditEnabledAt
                      ? `Enabled by ${app.studentEditEnabledByName || 'Admin/Staff'} on ${new Date(app.studentEditEnabledAt).toLocaleString()}.`
                      : 'Request the Students Affair Head/Admin to enable editing if any submitted student or event detail is incorrect.'}
                  </p>
                  {app.studentEditEnabledAt && <button
                    onClick={() => setSelectedAppForEdit(app)}
                    className="mt-3 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700"
                  >
                    <Pencil size={14} className="mr-1 inline" /> Edit This Event
                  </button>}
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
                  {/* If Draft, show Open Draft button */}
                  {app.status === 'DRAFT' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onEditDraft && onEditDraft(app)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                      leftIcon={<Pencil size={14} />}
                    >
                      Open & Edit Draft
                    </Button>
                  )}

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
      {selectedAppForEdit && currentUser && (
        <ApplicationEditModal
          application={selectedAppForEdit}
          editorUid={currentUser.uid}
          editorName={studentData.fullName}
          editorRole="STUDENT"
          onClose={() => setSelectedAppForEdit(null)}
          onSaved={updated => {
            setApplications(current => current.map(item => item.id === updated.id ? updated : item));
            setSelectedAppForEdit(null);
          }}
        />
      )}
    </div>
  );
};
