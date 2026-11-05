import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { EventApplication, UserRole } from '../../types';
import { editCompletedApplication } from '../../services/firebase/firestoreService';
import { Button } from './Button';
import { Modal } from './Modal';

interface ApplicationEditModalProps {
  application: EventApplication;
  editorUid: string;
  editorName: string;
  editorRole: UserRole;
  onClose: () => void;
  onSaved: (application: EventApplication) => void;
}

export const ApplicationEditModal: React.FC<ApplicationEditModalProps> = ({
  application,
  editorUid,
  editorName,
  editorRole,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState({
    studentName: application.studentName,
    eventName: application.eventName,
    eventCategory: application.eventCategory,
    organizerName: application.organizerName,
    institutionName: application.institutionName,
    eventLocation: application.eventLocation,
    startDate: application.startDate,
    endDate: application.endDate,
    eventMode: application.eventMode,
    eventWebsite: application.eventWebsite || '',
    registrationLink: application.registrationLink || '',
    eventDescription: application.eventDescription,
    parentGuardianName: application.parentGuardianName || '',
    parentGuardianMobile: application.parentGuardianMobile || '',
    guideName: application.guideName || '',
    participationType: application.participationType,
    teamName: application.teamName || '',
    teamSize: application.teamSize || 2,
    teamMembers: application.teamMembers || [],
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setField = (field: string, value: string | number) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const save = () => {
    if (!form.studentName.trim() || !form.eventName.trim() || !form.organizerName.trim() ||
      !form.institutionName.trim() || !form.eventLocation.trim() || !form.eventDescription.trim()) {
      setError('Student name and all required event details must be filled in.');
      return;
    }
    if (!form.startDate || !form.endDate || new Date(form.startDate) > new Date(form.endDate)) {
      setError('Please provide a valid event date range.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = editCompletedApplication(application.id, {
        ...form,
        studentName: form.studentName.trim(),
        eventName: form.eventName.trim(),
        eventCategory: form.eventCategory.trim(),
        organizerName: form.organizerName.trim(),
        institutionName: form.institutionName.trim(),
        eventLocation: form.eventLocation.trim(),
        eventDescription: form.eventDescription.trim(),
        facultyCoordinator: form.guideName.trim(),
      }, editorUid, editorName, editorRole);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save the edited application.');
    } finally {
      setSaving(false);
    }
  };

  const input = (label: string, field: keyof typeof form, required = false) => (
    <label className="block text-xs font-bold text-slate-700">
      {label}{required && <span className="text-rose-500"> *</span>}
      <input
        value={String(form[field])}
        onChange={event => setField(field, event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
      />
    </label>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title={editorRole === 'STUDENT' ? 'Enable Student Editing' : 'Enable Staff/Admin Editing'} subtitle="Register number is fixed and cannot be changed." maxWidth="2xl">
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
          This application is already 100% approved. Correct only genuine errors; every change is recorded in the approval history.
        </div>
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">{error}</p>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">{input('Student Name', 'studentName', true)}</div>
          {input('Event Name', 'eventName', true)}
          {input('Event Category', 'eventCategory', true)}
          {input('Organizer Name', 'organizerName', true)}
          {input('Institution Name', 'institutionName', true)}
          {input('Event Location', 'eventLocation', true)}
          {input('Start Date', 'startDate', true)}
          {input('End Date', 'endDate', true)}
          {input('Event Mode', 'eventMode', true)}
          {input('Event Website', 'eventWebsite')}
          {input('Registration Link', 'registrationLink')}
          {input('Parent/Guardian Name', 'parentGuardianName')}
          {input('Parent/Guardian Mobile', 'parentGuardianMobile')}
          {input('Guide / Staff Name', 'guideName')}
          <div className="sm:col-span-2">{input('Team Name', 'teamName')}</div>
          <label className="block text-xs font-bold text-slate-700 sm:col-span-2">
            Event Description
            <textarea value={form.eventDescription} onChange={event => setField('eventDescription', event.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500" />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving} leftIcon={<Save size={14} />}>
            {saving ? 'Saving...' : 'Save Edited Details'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
