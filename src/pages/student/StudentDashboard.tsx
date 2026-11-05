import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { EventApplication } from '../../types';
import { getApplicationsForStudent } from '../../services/firebase/firestoreService';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface StudentDashboardProps {
  onNewEvent: () => void;
  onViewApplications: () => void;
  onSelectApplication: (app: EventApplication) => void;
  onOpenTeamFormation: () => void;
  onEditDraft?: (app: EventApplication) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNewEvent,
  onViewApplications,
  onSelectApplication,
  onOpenTeamFormation,
  onEditDraft,
}) => {
  const { currentUser, studentData } = useAuth();
  if (!currentUser || !studentData) return null;

  const applications = getApplicationsForStudent(studentData.registrationNumber);
  const drafts = applications.filter(a => a.status === 'DRAFT');

  // Statistics calculation
  const totalEvents = applications.filter(a => a.status !== 'DRAFT').length;
  const pendingEvents = applications.filter(a =>
    ['SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'CERTIFICATE_SUBMITTED', 'FINAL_VERIFICATION'].includes(a.status)
  ).length;
  const preApprovedEvents = applications.filter(a => a.status === 'PRE_APPROVED').length;
  const completedEvents = applications.filter(a => a.status === 'COMPLETED').length;
  const rejectedEvents = applications.filter(a => a.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Student Event Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Welcome, {studentData.fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 font-medium">
              <span className="font-mono bg-white/10 px-2 py-0.5 rounded-md font-bold text-white">
                {studentData.registrationNumber}
              </span>
              <span>•</span>
              <span>{studentData.section}</span>
              <span>•</span>
              <span>{studentData.department}</span>
            </div>
          </div>

          {/* Prominent Add New Event Button */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={onNewEvent}
              leftIcon={<PlusCircle size={20} />}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-md font-bold"
            >
              Add New Event
            </Button>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Saved Drafts Reminder Banner */}
      {drafts.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl shrink-0 font-bold">
              📝
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                You have {drafts.length} saved draft application{drafts.length > 1 ? 's' : ''}
              </h3>
              <p className="text-xs text-amber-800">
                Drafts are completely private to you. They will not be sent to staff or admin until submitted.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onEditDraft && onEditDraft(drafts[0])}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
            >
              Resume Draft: {drafts[0].eventName || 'Untitled Event'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewApplications}
              className="border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              View Drafts ({drafts.length})
            </Button>
          </div>
        </div>
      )}

      {/* Dashboard Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Events
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalEvents}</span>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
            <Clock size={12} /> Pending Review
          </span>
          <span className="text-2xl font-black text-amber-900 mt-1 block">{pendingEvents}</span>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 size={12} /> Pre-Approved (50%)
          </span>
          <span className="text-2xl font-black text-blue-900 mt-1 block">{preApprovedEvents}</span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
            <Award size={12} /> Completed (100%)
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">{completedEvents}</span>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle size={12} /> Rejected
          </span>
          <span className="text-2xl font-black text-rose-900 mt-1 block">{rejectedEvents}</span>
        </div>
      </div>

      {/* Active Applications Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Applications & Progress</h2>
            <p className="text-xs text-slate-500">Track pre-event approvals and certificate verification</p>
          </div>
          <button
            onClick={onViewApplications}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Calendar size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Event Submissions Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Submit your upcoming Hackathon, Workshop, Symposium, or Competition to receive official faculty pre-approval.
            </p>
            <Button variant="primary" size="sm" onClick={onNewEvent} leftIcon={<PlusCircle size={16} />}>
              Submit First Event
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.slice(0, 3).map((app) => (
              <div
                key={app.id}
                onClick={() => onSelectApplication(app)}
                className="p-4 sm:p-5 bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200 rounded-2xl transition-all cursor-pointer space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {app.applicationNumber}
                      </span>
                      <span className="text-xs font-bold text-blue-700">{app.eventCategory}</span>
                      <span className="text-[11px] text-slate-400">• {app.eventMode}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{app.eventName}</h3>
                    <p className="text-xs text-slate-500">
                      {app.institutionName} ({app.eventLocation})
                    </p>
                  </div>
                  <div>
                    <Badge status={app.status} />
                  </div>
                </div>

                {/* Progress Bar Component */}
                <ProgressBar
                  status={app.status}
                  progressPercent={app.progressPercent}
                  preApprovedBy={app.preApprovedByName}
                  preApprovedAt={app.preApprovedAt}
                  completedAt={app.completedAt}
                />

                {/* Status-specific action notes */}
                {app.status === 'PRE_APPROVED' && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 text-xs flex items-center justify-between">
                    <span>Pre-approval granted! Once you attend, upload your certificate to complete 100%.</span>
                    <span className="font-bold underline ml-2 shrink-0">Upload Certificates</span>
                  </div>
                )}

                {app.status === 'CORRECTION_REQUIRED' && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs">
                    <span className="font-bold block">Correction Requested:</span>
                    <span>{app.correctionRemarks}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Team Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Participating as a Team?</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Form collaborative squads across academic sections and confirm individual invitations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenTeamFormation}>
          Manage Teams
        </Button>
      </div>
    </div>
  );
};
