import React, { useMemo, useState, useEffect } from 'react';
import { CalendarDays, Download, Eye, Filter, MapPin, Pencil, Trash2, XCircle, MoreVertical, Lock, Unlock } from 'lucide-react';
import { EventApplication, UserRole } from '../../types';
import { getApprovalLogs } from '../../services/firebase/firestoreService';
import { Badge } from './Badge';
import { Modal } from './Modal';
import { ApplicationEditModal } from './ApplicationEditModal';
import { PinVerificationModal } from './PinVerificationModal';

interface SubmissionsPanelProps {
  applications: EventApplication[];
  onApprove: (application: EventApplication) => void;
  onComplete?: (application: EventApplication) => void;
  onReject: (application: EventApplication) => void;
  onDelete: (application: EventApplication) => void | Promise<void>;
  onUpdate?: (application: EventApplication) => void;
  onEnableStudentEdit?: (application: EventApplication) => void | Promise<void>;
  onDisableStudentEdit?: (application: EventApplication) => void | Promise<void>;
  editorUid?: string;
  editorName?: string;
  editorRole?: UserRole;
}

function isImageDocument(url: string): boolean {
  const cleanUrl = url.split('?')[0].toLowerCase();
  return /\.(avif|gif|jpe?g|png|webp|bmp|svg)$/.test(cleanUrl) ||
    cleanUrl.startsWith('data:image/');
}

export const SubmissionsPanel: React.FC<SubmissionsPanelProps> = ({ applications, onApprove, onComplete, onReject, onDelete, onUpdate, onEnableStudentEdit, onDisableStudentEdit, editorUid, editorName, editorRole }) => {
  const [stage, setStage] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [selected, setSelected] = useState<EventApplication | null>(null);
  const [selectedStage, setSelectedStage] = useState<'FIFTY' | 'HUNDRED' | 'FULL'>('FIFTY');
  const [editing, setEditing] = useState<EventApplication | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [appToDelete, setAppToDelete] = useState<EventApplication | null>(null);

  useEffect(() => {
    const handleOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  const categories = Array.from(new Set(applications.map(app => app.eventCategory).filter(Boolean))).sort();
  const filtered = useMemo(() => applications.filter(app => {
    if (app.status === 'DRAFT') return false; // Drafts are strictly private to student
    const stageMatch = stage === 'ALL' ||
      (stage === 'PENDING' && ['SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED'].includes(app.status)) ||
      (stage === 'FIFTY' && ['PRE_APPROVED', 'AWAITING_POST_EVENT', 'CERTIFICATE_SUBMITTED', 'FINAL_VERIFICATION'].includes(app.status)) ||
      (stage === 'FULL' && app.status === 'COMPLETED') ||
      (stage === 'REJECTED' && app.status === 'REJECTED');
    return stageMatch && (category === 'ALL' || app.eventCategory === category);
  }), [applications, stage, category]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Submissions</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">Student event submissions awaiting review and approval.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={stage} onChange={event => setStage(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
            <option value="ALL">All submission stages</option>
            <option value="PENDING">Pending review</option>
            <option value="FIFTY">50% pre-approved</option>
            <option value="FULL">100% completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select value={category} onChange={event => setCategory(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
            <option value="ALL">All event types</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-xs text-slate-500">No submissions match these filters.</div>
        ) : filtered.map((app, index) => (
          <div key={app.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_1.2fr_1fr_auto] lg:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Register Number</p>
                <p className="mt-1 font-mono text-sm font-bold text-blue-700">{app.studentRegNo}</p>
                <p className="text-xs font-semibold text-slate-900">{app.studentName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Section & Event Type</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{app.section}</p>
                <p className="text-xs text-slate-500">{app.eventCategory}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Event & Dates</p>
                <p className="mt-1 truncate text-sm font-bold text-slate-900">{app.eventName}</p>
                <p className="text-xs text-slate-500">{app.startDate} to {app.endDate}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => { setSelectedStage(app.status === 'COMPLETED' ? 'FULL' : 'FIFTY'); setSelected(app); }}
                  className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Eye size={14} className="mr-1 inline" />
                  {app.status === 'COMPLETED' ? 'View Full Event' : 'View 50% Details'}
                </button>

                {app.status === 'CERTIFICATE_SUBMITTED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setSelectedStage('HUNDRED'); setSelected(app); }}
                      className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <Eye size={14} className="mr-1 inline" />View 100% Details
                    </button>
                    {onComplete && (
                      <button
                        type="button"
                        onClick={() => onComplete(app)}
                        className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        Approve 100%
                      </button>
                    )}
                  </>
                )}

                {/* Lock / Unlock Student Edit Toggle */}
                {app.status === 'COMPLETED' && editorRole && editorUid && editorName && (
                  <>
                    {app.studentEditEnabledAt ? (
                      <button
                        type="button"
                        onClick={() => onDisableStudentEdit && onDisableStudentEdit(app)}
                        className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
                        title="Lock student editing"
                      >
                        <Lock size={14} className="mr-1 inline text-amber-700" />
                        Lock Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEnableStudentEdit && onEnableStudentEdit(app)}
                        className="rounded-xl bg-violet-50 border border-violet-200 px-3 py-2 text-xs font-bold text-violet-800 hover:bg-violet-100 transition-colors"
                        title="Enable student editing"
                      >
                        <Unlock size={14} className="mr-1 inline text-violet-700" />
                        Enable Student Edit
                      </button>
                    )}
                  </>
                )}

                {['SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED'].includes(app.status) && (
                  <button
                    type="button"
                    onClick={() => onApprove(app)}
                    className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    Approve 50%
                  </button>
                )}

                {/* 3-Dots Action Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === app.id ? null : app.id);
                    }}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                    title="More actions"
                  >
                    <MoreVertical size={15} />
                  </button>

                  {openMenuId === app.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-20 space-y-1 animate-in fade-in"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setEditing(app);
                        }}
                        className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Pencil size={14} className="text-blue-600" />
                        <span>Staff/Admin Edit</span>
                      </button>

                      {app.status !== 'REJECTED' && app.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onReject(app);
                          }}
                          className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <XCircle size={14} className="text-rose-600" />
                          <span>Reject Event</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setAppToDelete(app);
                        }}
                        className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer border-t border-slate-100"
                      >
                        <Trash2 size={14} className="text-rose-600" />
                        <span>Delete Submission</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
              {app.status === 'PRE_APPROVED' && (
                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900">
                  50% approved. Waiting for the student to submit post-event certificates for 100% verification.
                </div>
              )}
              {app.status === 'CERTIFICATE_SUBMITTED' && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                  100% submission received. Waiting for Admin/Staff final verification.
                </div>
              )}
          </div>
        ))}
      </div>

      {selected && (
        <Modal isOpen={true} onClose={() => setSelected(null)} title={selectedStage === 'HUNDRED' ? '100% Verification Details' : selectedStage === 'FULL' ? 'Completed Event Details' : '50% Submission Details'} subtitle={`${selected.studentName} • ${selected.studentRegNo}`} maxWidth="xl">
          <div className="space-y-5">
            <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white">
              <p className="text-xs font-semibold text-blue-100">{selected.eventCategory}</p>
              <h3 className="mt-1 text-xl font-black">{selected.eventName}</h3>
              <p className="mt-2 text-xs text-blue-100">{selected.organizerName} • {selected.institutionName}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Register Number', selected.studentRegNo],
                ['Student Name', selected.studentName],
                ['Section', selected.section],
                ['Event Mode', selected.eventMode],
                ['Start Date', selected.startDate],
                ['End Date', selected.endDate],
                ['Location', selected.eventLocation],
                ['Status', selected.status],
              ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-bold text-slate-800">{value}</p></div>)}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-bold text-slate-900">Event Description</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selected.eventDescription || 'No description provided.'}</p>
            </div>
            {(selected.status === 'CERTIFICATE_SUBMITTED' || selected.status === 'COMPLETED') && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
                <h4 className="text-sm font-bold text-indigo-950">Post-Event Details</h4>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-indigo-900 sm:grid-cols-2">
                  <p><span className="font-semibold">Attendance marked:</span> {selected.actualAttendanceMarked ? 'Yes' : 'No'}</p>
                  <p><span className="font-semibold">Prize won:</span> {selected.prizeWon ? 'Yes' : 'No'}</p>
                  {selected.prizeWon && <p><span className="font-semibold">Prize:</span> {selected.prizeName || selected.prizeCategory || 'Not specified'}</p>}
                  <p className="sm:col-span-2"><span className="font-semibold">Participation:</span> {selected.actualParticipationDetails || 'Not provided'}</p>
                  {selected.achievementDescription && <p className="sm:col-span-2"><span className="font-semibold">Achievement:</span> {selected.achievementDescription}</p>}
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-bold text-slate-900">Workflow Timeline</h4>
              <div className="mt-3 space-y-2 text-xs">
                <p><span className="font-bold text-slate-500">Initial submission:</span> {new Date(selected.createdAt).toLocaleString()}</p>
                <p><span className="font-bold text-slate-500">50% approval:</span> {selected.preApprovedAt ? `${selected.preApprovedByName || 'Staff/Admin'} • ${new Date(selected.preApprovedAt).toLocaleString()}` : 'Pending'}</p>
                <p><span className="font-bold text-slate-500">100% certificate submission:</span> {selected.postEventSubmittedAt ? new Date(selected.postEventSubmittedAt).toLocaleString() : 'Not submitted yet'}</p>
                <p><span className="font-bold text-slate-500">100% final approval:</span> {selected.completedAt ? `${selected.completedByName || 'Staff/Admin'} • ${new Date(selected.completedAt).toLocaleString()}` : 'Pending final verification'}</p>
              </div>
              <div className="mt-3 border-t border-slate-200 pt-3 space-y-2">
                {getApprovalLogs(selected.id).map(log => (
                  <p key={log.id} className="text-xs text-slate-600">
                    <span className="font-bold">{log.action}</span> • {new Date(log.timestamp).toLocaleString()} • {log.performedByName} ({log.performedByRole})
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <h4 className="text-sm font-bold text-amber-950">Parent/Guardian & Guide Details</h4>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-amber-900 sm:grid-cols-3">
                  <p><span className="font-semibold">Parent/Guardian:</span> {selected.parentGuardianName || 'Not provided'}</p>
                  <p><span className="font-semibold">Mobile:</span> {selected.parentGuardianMobile || 'Not provided'}</p>
                  <p><span className="font-semibold">Guide / Staff:</span> {selected.guideName || 'Not provided'}</p>
                </div>
              </div>
            {selected.status === 'CERTIFICATE_SUBMITTED' || selected.status === 'COMPLETED' ? (
              <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                <h4 className="text-sm font-bold text-emerald-950">100% Submitted Documents</h4>
                {selected.participationCertUrl && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-800">Participation Certificate</p>
                      <a href={selected.participationCertUrl} download className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white">Download</a>
                    </div>
                    <div className="mt-2 flex h-48 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1">
                      {isImageDocument(selected.participationCertUrl) ? (
                        <img src={selected.participationCertUrl} alt="Participation certificate" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <iframe src={selected.participationCertUrl} title="Participation certificate" className="h-full w-full border-0" />
                      )}
                    </div>
                  </div>
                )}
                {selected.prizeWon && selected.winnerCertUrl && (
                  <div className="rounded-xl border border-amber-200 bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-amber-900">Winner Certificate</p>
                      <a href={selected.winnerCertUrl} download className="rounded-lg bg-amber-600 px-2.5 py-1.5 text-[11px] font-bold text-white">Download</a>
                    </div>
                    <div className="mt-2 flex h-48 items-center justify-center overflow-hidden rounded-lg border border-amber-200 bg-amber-50/30 p-1">
                      {isImageDocument(selected.winnerCertUrl) ? (
                        <img src={selected.winnerCertUrl} alt="Winner certificate" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <iframe src={selected.winnerCertUrl} title="Winner certificate" className="h-full w-full border-0" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              {selected.browserUrl && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">Browser / Proof of Registration</p>
                    <a href={selected.browserUrl} download className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
                      <Download size={14} className="mr-1 inline" /> Download
                    </a>
                  </div>
                  <div className="mt-3 flex h-72 w-full items-center justify-center overflow-hidden rounded-xl border border-blue-200 bg-white p-2">
                    {isImageDocument(selected.browserUrl) ? (
                      <img
                        src={selected.browserUrl}
                        alt="Browser proof"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <iframe
                        src={selected.browserUrl}
                        title="Browser proof document"
                        className="h-full w-full border-0"
                      />
                    )}
                  </div>
                </div>
              )}
              {selected.brochureUrl && (
                <a href={selected.brochureUrl} download className="inline-flex items-center rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100">
                  <Download size={14} className="mr-1" /> Download Brochure
                </a>
              )}
            </div>
            {selected.status === 'COMPLETED' && editorRole && editorUid && editorName && (
              <div className="flex justify-end border-t border-slate-100 pt-4">
                <div className="flex flex-wrap justify-end gap-2">
                  {onEnableStudentEdit && <button onClick={() => onEnableStudentEdit(selected)} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700"><Pencil size={14} className="mr-1 inline" />Enable Student Edit</button>}
                  <button onClick={() => setEditing(selected)} className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"><Pencil size={14} className="mr-1 inline" />Staff/Admin Edit</button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      {editing && editorRole && editorUid && editorName && (
        <ApplicationEditModal
          application={editing}
          editorUid={editorUid}
          editorName={editorName}
          editorRole={editorRole}
          onClose={() => setEditing(null)}
          onSaved={updated => {
            onUpdate?.(updated);
            setEditing(null);
            setSelected(current => current?.id === updated.id ? updated : current);
          }}
        />
      )}

      <PinVerificationModal
        isOpen={!!appToDelete}
        onClose={() => setAppToDelete(null)}
        onSuccess={async () => {
          if (appToDelete) {
            await onDelete(appToDelete);
            setAppToDelete(null);
          }
        }}
        title={`Delete Event: "${appToDelete?.eventName || ''}"`}
        description={`Permanently delete application ${appToDelete?.applicationNumber || ''} for student ${appToDelete?.studentName || ''} (${appToDelete?.studentRegNo || ''})? This action cannot be reversed.`}
        confirmButtonText="Delete Submission"
      />
    </div>
  );
};
