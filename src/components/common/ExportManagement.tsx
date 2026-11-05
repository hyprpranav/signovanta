import React from 'react';
import Papa from 'papaparse';
import { Download } from 'lucide-react';
import { Student, Staff, EventApplication } from '../../types';
import { getApprovalLogs } from '../../services/firebase/firestoreService';

interface ExportManagementProps {
  students: Student[];
  staff: Staff[];
  applications: EventApplication[];
  isMasterAdmin?: boolean;
}

type ExportRow = Record<string, string | number | boolean>;

const download = (rows: ExportRow[], filename: string, excel = false) => {
  const csv = Papa.unparse(rows);
  const content = excel
    ? `<html><head><meta charset="utf-8"></head><body><table><tr>${Object.keys(rows[0] || {}).map(key => `<th>${key}</th>`).join('')}</tr>${rows.map(row => `<tr>${Object.values(row).map(value => `<td>${String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</td>`).join('')}</tr>`).join('')}</table></body></html>`
    : csv;
  const blob = new Blob([content], { type: excel ? 'application/vnd.ms-excel' : 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${excel ? 'xls' : 'csv'}`;
  link.click();
  URL.revokeObjectURL(url);
};

const toRow = (app: EventApplication, index: number, student?: Student): ExportRow => ({
  'Serial Number': index + 1,
  'Student Name': app.studentName,
  'Registration Number': app.studentRegNo,
  Section: app.section,
  'Academic Year': app.academicYear,
  'Event Name': app.eventName,
  'Event Category': app.eventCategory,
  Institution: app.institutionName,
  'Event Date': `${app.startDate} to ${app.endDate}`,
  'Participation Status': app.status,
  'Prize Won': app.prizeWon ? 'Yes' : 'No',
  'Prize Category': app.prizeName || app.prizeCategory || 'Participation Only',
  'Participation Certificate': app.participationCertUrl ? 'Submitted' : 'Not Submitted',
  'Winner Certificate': app.winnerCertUrl ? 'Submitted' : 'Not Submitted',
  'Approval Progress': `${app.progressPercent}%`,
  'Submitted At': app.createdAt,
  'Post-Event Submitted At': app.postEventSubmittedAt || '',
  'Approved By': app.completedByName || app.preApprovedByName || '',
  'Approved Role': app.preApprovedRole || '',
  'Student Account Status': student?.status || '',
});

export const ExportManagement: React.FC<ExportManagementProps> = ({
  students,
  staff,
  applications,
  isMasterAdmin = false,
}) => {
  const rows = applications.map((app, index) => toRow(app, index, students.find(student => student.registrationNumber === app.studentRegNo)));
  const overallRows: ExportRow[] = [
    ...students.map(student => ({
      Type: 'Student',
      Name: student.fullName,
      'Registration Number': student.registrationNumber,
      Email: student.email,
      Section: student.section,
      'Academic Year': student.academicYear,
      'Account Status': student.status,
      Activated: student.isActivated ? 'Yes' : 'No',
      Events: student.eventCount,
    })),
    ...(isMasterAdmin ? staff.map(member => ({
      Type: 'Staff',
      Name: member.fullName,
      'Registration Number': member.staffId,
      Email: member.email,
      Section: member.department,
      'Academic Year': '',
      'Account Status': member.approvalStatus,
      Activated: member.approvalStatus === 'APPROVED' ? 'Yes' : 'No',
      Events: '',
    })) : []),
    ...rows.map(row => ({ Type: 'Event Application', ...row })),
    ...getApprovalLogs().map(log => ({
      Type: 'Approval History',
      Name: log.performedByName,
      'Registration Number': log.performedByUid,
      Email: '',
      Section: log.performedByRole,
      'Academic Year': '',
      'Account Status': log.action,
      Activated: log.timestamp,
      Events: log.remarks || '',
    })),
  ];

  const classRows = (className: string) => applications.filter(app => app.section.endsWith(`ECE ${className}`)).map((app, index) => toRow(app, index, students.find(student => student.registrationNumber === app.studentRegNo)));

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
        <div><h2 className="text-base font-bold text-slate-900">Export Center</h2><p className="text-xs text-slate-500">Download reports from the live database. Total event applications: {rows.length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="text-xs font-bold text-slate-900 mb-2">Achievement-wise Export</h3>
          <div className="flex flex-wrap gap-2">
            {['1st Prize', '2nd Prize', '3rd Prize', 'Consolation Prize', 'Special Prize', 'Other', 'Participation Only'].map(value => {
              const achievementRows = value === 'Participation Only'
                ? applications.filter(app => !app.prizeWon).map((app, index) => toRow(app, index, students.find(student => student.registrationNumber === app.studentRegNo)))
                : applications.filter(app => app.prizeWon && ((app.prizeCategory || '').includes(value) || (value === 'Other' && app.prizeCategory === 'Other'))).map((app, index) => toRow(app, index, students.find(student => student.registrationNumber === app.studentRegNo)));
              return <button key={value} onClick={() => download(achievementRows, `signovanta-achievement-${value.toLowerCase().replace(/\s+/g, '-')}`)} className="inline-flex min-h-[40px] items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 text-white border border-emerald-700 rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all">{value}</button>;
            })}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
          <h3 className="text-xs font-bold">Overall Database</h3>
          <button onClick={() => download(overallRows, 'signovanta-overall-database')} className="w-full min-h-[40px] px-3 py-2 text-xs font-bold text-white bg-blue-600 border border-blue-700 rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md transition-all flex items-center justify-center gap-2"><Download size={14} /> Download CSV</button>
          <button onClick={() => download(overallRows, 'signovanta-overall-database', true)} className="w-full min-h-[40px] px-3 py-2 text-xs font-bold text-white bg-emerald-600 border border-emerald-700 rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all flex items-center justify-center gap-2"><Download size={14} /> Download Excel</button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
          <h3 className="text-xs font-bold">Student / Event Results</h3>
          <button onClick={() => download(rows, 'signovanta-filtered-events')} className="w-full min-h-[40px] px-3 py-2 text-xs font-bold text-white bg-blue-600 border border-blue-700 rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md transition-all flex items-center justify-center gap-2"><Download size={14} /> Download CSV</button>
          <button onClick={() => download(rows, 'signovanta-filtered-events', true)} className="w-full min-h-[40px] px-3 py-2 text-xs font-bold text-white bg-emerald-600 border border-emerald-700 rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all flex items-center justify-center gap-2"><Download size={14} /> Download Excel</button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 sm:col-span-2">
          <h3 className="text-xs font-bold">Class-wise Export</h3>
          <div className="flex flex-wrap gap-2">{['A', 'B', 'C', 'D', 'E'].map(value => <button key={value} onClick={() => download(classRows(value), `signovanta-section-${value}`)} className="min-h-[40px] px-4 py-2 text-xs font-bold text-white bg-blue-600 border border-blue-700 rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md transition-all">Download Section {value}</button>)}</div>
          <p className="text-[11px] text-slate-500">Exports students with event applications, including 50% submissions.</p>
        </div>
      </div>
    </div>
  );
};
