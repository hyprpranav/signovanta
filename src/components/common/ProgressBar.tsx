import React from 'react';
import { CheckCircle2, Clock, Award, AlertCircle } from 'lucide-react';
import { ApplicationStatus } from '../../types';

interface ProgressBarProps {
  status: ApplicationStatus;
  progressPercent: number; // 0, 50, 100
  preApprovedBy?: string;
  preApprovedAt?: string;
  completedAt?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  status,
  progressPercent,
  preApprovedBy,
  preApprovedAt,
  completedAt,
}) => {
  const isRejected = status === 'REJECTED';
  const isCorrection = status === 'CORRECTION_REQUIRED';
  const isPreApproved = progressPercent >= 50;
  const isCompleted = progressPercent === 100;

  return (
    <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Approval Progress
          </span>
          {isRejected && (
            <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <AlertCircle size={14} /> Rejected
            </span>
          )}
          {isCorrection && (
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
              <AlertCircle size={14} /> Action Required
            </span>
          )}
        </div>
        <span className="text-sm font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
          {progressPercent}%
        </span>
      </div>

      {/* Visual track */}
      <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isRejected
              ? 'bg-rose-500'
              : isCompleted
              ? 'bg-emerald-500'
              : isPreApproved
              ? 'bg-blue-600'
              : 'bg-slate-300'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stepper Milestones */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {/* Step 1: Submission */}
        <div className="flex flex-col items-center">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1.5 transition-colors ${
              progressPercent >= 0
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <CheckCircle2 size={16} />
          </div>
          <span className="font-semibold text-slate-800">Submitted</span>
          <span className="text-[11px] text-slate-400">Step 1</span>
        </div>

        {/* Step 2: Pre-Approval (50%) */}
        <div className="flex flex-col items-center">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1.5 transition-colors ${
              isPreApproved
                ? 'bg-blue-600 text-white ring-4 ring-blue-50'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {isPreApproved ? <CheckCircle2 size={16} /> : <Clock size={15} />}
          </div>
          <span
            className={`font-semibold ${
              isPreApproved ? 'text-blue-900' : 'text-slate-500'
            }`}
          >
            50% Pre-Approved
          </span>
          <span className="text-[11px] text-slate-400">
            {preApprovedBy ? `By ${preApprovedBy}` : 'Faculty Review'}
          </span>
        </div>

        {/* Step 3: 100% Completion */}
        <div className="flex flex-col items-center">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1.5 transition-colors ${
              isCompleted
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Award size={16} />
          </div>
          <span
            className={`font-semibold ${
              isCompleted ? 'text-emerald-900' : 'text-slate-500'
            }`}
          >
            100% Verified
          </span>
          <span className="text-[11px] text-slate-400">
            {isCompleted
              ? 'Completed'
              : status === 'CERTIFICATE_SUBMITTED'
              ? 'Awaiting final approval'
              : 'Certificates required'}
          </span>
        </div>
      </div>
    </div>
  );
};
