import React from 'react';
import { ApplicationStatus, UserRole } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
  status?: ApplicationStatus;
  role?: UserRole;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  role,
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (role) {
    const roleConfig: Record<UserRole, { bg: string; text: string; label: string }> = {
      MASTER_ADMIN: { bg: 'bg-purple-100 border-purple-200', text: 'text-purple-800', label: 'MASTER ADMIN' },
      HOD: { bg: 'bg-blue-100 border-blue-200', text: 'text-blue-900', label: 'HEAD OF DEPT (HOD)' },
      AHOD: { bg: 'bg-sky-100 border-sky-200', text: 'text-sky-800', label: 'ASST HOD (AHOD)' },
      STAFF: { bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-800', label: 'FACULTY STAFF' },
      STUDENT: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-800', label: 'STUDENT' },
    };
    const c = roleConfig[role];
    return (
      <span className={`inline-flex items-center font-bold tracking-wider rounded-lg border ${c.bg} ${c.text} ${sizeClass}`}>
        {children || c.label}
      </span>
    );
  }

  if (status) {
    const statusConfig: Record<ApplicationStatus, { bg: string; text: string; label: string }> = {
      DRAFT: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', label: 'Draft' },
      SUBMITTED: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Submitted' },
      UNDER_REVIEW: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', label: 'Under Review' },
      CORRECTION_REQUIRED: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', label: 'Correction Required' },
      REJECTED: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', label: 'Rejected' },
      PRE_APPROVED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', label: 'Pre-Approved (50%)' },
      AWAITING_POST_EVENT: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800', label: 'Awaiting Certificates' },
      CERTIFICATE_SUBMITTED: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-800', label: 'Certificates Submitted' },
      FINAL_VERIFICATION: { bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-800', label: 'Final Verification' },
      COMPLETED: { bg: 'bg-green-100 border-green-300', text: 'text-green-900', label: 'Completed (100%)' },
    };
    const c = statusConfig[status];
    return (
      <span className={`inline-flex items-center font-semibold rounded-lg border shadow-xs ${c.bg} ${c.text} ${sizeClass}`}>
        {children || c.label}
      </span>
    );
  }

  const variants = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    neutral: 'bg-slate-100 text-slate-800 border-slate-200',
    brand: 'bg-navy-50 text-navy-900 border-navy-200',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-lg border ${variants[variant || 'neutral']} ${sizeClass}`}>
      {children}
    </span>
  );
};

