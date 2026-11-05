import React, { useState } from 'react';
import { AlertTriangle, LockKeyhole, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Student, Staff } from '../../types';

interface DeleteThingsPanelProps {
  students: Student[];
  staff: Staff[];
  onRequestStudentDelete?: (student: Student) => void;
}

export const DeleteThingsPanel: React.FC<DeleteThingsPanelProps> = ({
  students,
  staff,
  onRequestStudentDelete,
}) => {
  const [selectedAction, setSelectedAction] = useState<'students' | 'staff' | 'all' | null>(null);
  const [pin, setPin] = useState('');
  const [firstWarningAccepted, setFirstWarningAccepted] = useState(false);

  const closeWarning = () => {
    setSelectedAction(null);
    setPin('');
    setFirstWarningAccepted(false);
  };

  const actionLabel = selectedAction === 'students'
    ? 'all student data'
    : selectedAction === 'staff'
    ? 'all staff data'
    : 'the entire application database';

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={20} />
          <div>
            <h2 className="text-sm font-bold text-amber-900">Delete Things</h2>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              These controls are prepared for a future deletion workflow. They currently do not change Firebase, local storage, or any database.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          {
            key: 'students' as const,
            title: 'Delete Student Data',
            description: 'Remove student records and their submitted event data.',
            count: students.length,
            color: 'rose',
          },
          {
            key: 'staff' as const,
            title: 'Delete Staff Data',
            description: 'Remove all staff records and role information.',
            count: staff.length,
            color: 'orange',
          },
          {
            key: 'all' as const,
            title: 'Delete Entire Database',
            description: 'Reserved for a complete application data reset.',
            count: students.length + staff.length,
            color: 'slate',
          },
        ].map(action => (
          <div key={action.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-${action.color}-100 text-${action.color}-700`}>
              <Trash2 size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{action.title}</h3>
            <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{action.description}</p>
            <p className="mt-4 text-xs font-semibold text-slate-400">{action.count} records currently visible</p>
            <button
              type="button"
              onClick={() => setSelectedAction(action.key)}
              className="mt-4 w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
            >
              Prepare Delete Request
            </button>
          </div>
        ))}
      </div>

      {onRequestStudentDelete && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Delete Individual Student Data</h3>
            <p className="mt-1 text-xs text-slate-500">Choose a student to prepare a protected deletion request.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {students.slice(0, 12).map(student => (
              <div key={student.id} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-800">{student.fullName}</p>
                  <p className="truncate font-mono text-[10px] text-slate-500">{student.registrationNumber}</p>
                </div>
                <button type="button" onClick={() => onRequestStudentDelete(student)} className="shrink-0 rounded-lg bg-rose-50 px-2 py-1.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100">
                  Delete
                </button>
              </div>
            ))}
          </div>
          {students.length > 12 && <p className="mt-3 text-[11px] text-slate-400">Showing the first 12 students. Use Student Management for the full directory.</p>}
        </section>
      )}

      {selectedAction && (
        <Modal isOpen={true} onClose={closeWarning} title="Confirm Delete Request" subtitle="Two warnings are required before continuing" maxWidth="md">
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-bold text-rose-900">Warning 1: This action is destructive</p>
              <p className="mt-1 text-xs leading-5 text-rose-800">You are preparing a request to delete {actionLabel}. Submitted events and related records may also be affected.</p>
            </div>
            <label className="flex items-start gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" checked={firstWarningAccepted} onChange={event => setFirstWarningAccepted(event.target.checked)} className="mt-0.5" />
              I understand that deleted records cannot be recovered.
            </label>
            {firstWarningAccepted && (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-900">Warning 2: Confirm with the secret PIN</p>
                <p className="text-xs leading-5 text-amber-800">Enter the secret PIN to verify authorization. The PIN is never displayed.</p>
                <div className="relative">
                  <LockKeyhole size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input type="password" value={pin} onChange={event => setPin(event.target.value)} placeholder="Secret PIN" className="w-full rounded-xl border border-amber-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <button type="button" disabled={!pin} onClick={() => closeWarning()} className="w-full rounded-xl bg-slate-300 px-3 py-2.5 text-xs font-bold text-slate-600 disabled:cursor-not-allowed">
                  Confirm Delete Request
                </button>
                <p className="text-[11px] font-semibold text-amber-800">UI-only mode: no data will be deleted.</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
