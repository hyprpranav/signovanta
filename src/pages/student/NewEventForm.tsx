import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EventApplication, ParticipationType, EventMode } from '../../types';
import { getCategories, createApplication } from '../../services/firebase/firestoreService';
import { uploadToCloudinary } from '../../services/cloudinary/cloudinaryService';
import { Button } from '../../components/common/Button';
import {
  UploadCloud,
  Calendar,
  MapPin,
  Globe,
  Link2,
  Users,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Save,
} from 'lucide-react';

interface NewEventFormProps {
  onBack: () => void;
  onSuccess: (app: EventApplication) => void;
}

export const NewEventForm: React.FC<NewEventFormProps> = ({ onBack, onSuccess }) => {
  const { currentUser, studentData } = useAuth();
  const categories = getCategories().filter(c => c.isActive);

  // Form Fields
  const [eventCategory, setEventCategory] = useState(categories[0]?.name || 'Hackathon');
  const [eventName, setEventName] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventMode, setEventMode] = useState<EventMode>('OFFLINE');
  const [eventWebsite, setEventWebsite] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [participationType, setParticipationType] = useState<ParticipationType>('INDIVIDUAL');
  const [teamName, setTeamName] = useState('');
  const [facultyCoordinator, setFacultyCoordinator] = useState('Dr. Priya Sundaram');

  // Brochure Upload
  const [brochureUrl, setBrochureUrl] = useState('');
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser || !studentData) return null;

  const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBrochure(true);
    setUploadProgress(10);
    setError(null);

    try {
      const res = await uploadToCloudinary(file, 'brochures', (pct) => {
        setUploadProgress(pct);
      });
      setBrochureUrl(res.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload event brochure.');
    } finally {
      setUploadingBrochure(false);
    }
  };

  const handleSubmit = (isDraft: boolean) => {
    setError(null);

    if (!eventName.trim()) {
      setError('Event Name is required.');
      return;
    }
    if (!organizerName.trim()) {
      setError('Organizer Name is required.');
      return;
    }
    if (!institutionName.trim()) {
      setError('Host Institution Name is required.');
      return;
    }
    if (!eventLocation.trim()) {
      setError('Event Location / City is required.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please provide valid Start and End dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('End Date cannot be before Start Date.');
      return;
    }
    if (!eventDescription.trim()) {
      setError('Event Description is required.');
      return;
    }
    if (participationType === 'TEAM' && !teamName.trim()) {
      setError('Please provide a Team Name for team participation.');
      return;
    }

    if (isDraft) setIsDrafting(true);
    else setIsSubmitting(true);

    try {
      const newApp = createApplication(
        {
          studentId: studentData.id,
          studentRegNo: studentData.registrationNumber,
          studentName: studentData.fullName,
          department: studentData.department,
          academicYear: studentData.academicYear,
          section: studentData.section,
          eventName: eventName.trim(),
          eventCategory,
          organizerName: organizerName.trim(),
          institutionName: institutionName.trim(),
          eventLocation: eventLocation.trim(),
          startDate,
          endDate,
          eventMode,
          eventWebsite: eventWebsite.trim(),
          registrationLink: registrationLink.trim(),
          eventDescription: eventDescription.trim(),
          participationType,
          teamName: participationType === 'TEAM' ? teamName.trim() : undefined,
          facultyCoordinator,
          brochureUrl,
          status: isDraft ? 'DRAFT' : 'SUBMITTED',
        },
        isDraft
      );

      onSuccess(newApp);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application.');
    } finally {
      setIsSubmitting(false);
      setIsDrafting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back button and page header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Event Pre-Approval Application</h1>
          <p className="text-xs text-slate-500">
            Submit event details for official staff & HOD verification
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(false);
        }}
        className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6"
      >
        {/* Step 1: Category Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Select Event Category <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setEventCategory(cat.name)}
                className={`p-3 rounded-2xl text-xs font-bold border text-left transition-all cursor-pointer ${
                  eventCategory === cat.name
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/10'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Event Details */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            2. Event Information
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Event Title / Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Smart India Hackathon 2026"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Organizing Body / Association <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="e.g. AICTE, IEEE, CSI"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Host College / Institution <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="e.g. IIT Madras"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Event Location / City <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g. Chennai, TN"
                  className="w-full pl-8 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <MapPin size={14} className="absolute left-2.5 top-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Event Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Event Mode</label>
            <div className="flex items-center gap-3">
              {(['OFFLINE', 'ONLINE'] as EventMode[]).map((mode) => (
                <label
                  key={mode}
                  className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                    eventMode === mode
                      ? 'bg-blue-50 text-blue-900 border-blue-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="eventMode"
                    value={mode}
                    checked={eventMode === mode}
                    onChange={() => setEventMode(mode)}
                    className="hidden"
                  />
                  <span>{mode === 'OFFLINE' ? '🏢 In-Person (Offline)' : '🌐 Virtual (Online)'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Website</label>
              <div className="relative">
                <input
                  type="url"
                  value={eventWebsite}
                  onChange={(e) => setEventWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <Globe size={14} className="absolute left-2.5 top-3 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Registration Link</label>
              <div className="relative">
                <input
                  type="url"
                  value={registrationLink}
                  onChange={(e) => setRegistrationLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <Link2 size={14} className="absolute left-2.5 top-3 text-slate-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Event Description & Objectives <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Explain the scope of the competition, theme, and relevance to your academic development..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>
        </div>

        {/* Step 3: Participation Type */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            3. Participation Type
          </h3>
          <div className="flex items-center gap-3">
            <label
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                participationType === 'INDIVIDUAL'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <input
                type="radio"
                name="participationType"
                checked={participationType === 'INDIVIDUAL'}
                onChange={() => setParticipationType('INDIVIDUAL')}
                className="hidden"
              />
              <User size={16} />
              <span>Individual Participation</span>
            </label>

            <label
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                participationType === 'TEAM'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <input
                type="radio"
                name="participationType"
                checked={participationType === 'TEAM'}
                onChange={() => setParticipationType('TEAM')}
                className="hidden"
              />
              <Users size={16} />
              <span>Team Participation</span>
            </label>
          </div>

          {participationType === 'TEAM' && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-blue-950">
                Team Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Innovators Club Squad"
                className="w-full px-3 py-2 text-xs bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
              <p className="text-[11px] text-blue-700">
                Team members can be configured in the <strong>Team Formation</strong> tab where each member must individually log in and confirm their invitation.
              </p>
            </div>
          )}
        </div>

        {/* Step 4: Faculty Coordinator & Brochure */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            4. Faculty Coordinator & Brochure
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Department Faculty Coordinator <span className="text-rose-500">*</span>
            </label>
            <select
              value={facultyCoordinator}
              onChange={(e) => setFacultyCoordinator(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
            >
              <option value="Dr. Priya Sundaram">Dr. Priya Sundaram (Associate Professor & AHOD - ECE)</option>
              <option value="Dr. M. Sangeetha">Dr. M. Sangeetha (Professor & HOD - ECE)</option>
              <option value="Prof. R. Venkatesh">Prof. R. Venkatesh (Assistant Professor - ECE)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Event Brochure / Poster (Image or PDF)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-2xl text-xs font-bold text-slate-700 transition-colors">
                  <UploadCloud size={18} />
                  <span>
                    {uploadingBrochure
                      ? `Uploading Brochure (${uploadProgress}%)...`
                      : brochureUrl
                      ? 'Brochure Uploaded (Click to Change)'
                      : 'Upload Official Event Brochure'}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleBrochureUpload}
                  disabled={uploadingBrochure}
                  className="hidden"
                />
              </label>

              {brochureUrl && (
                <a
                  href={brochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  View
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Save Draft vs Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(true)}
            isLoading={isDrafting}
            leftIcon={<Save size={16} />}
            className="w-full sm:w-auto"
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 size={16} />}
            className="w-full sm:w-auto font-bold"
          >
            Submit for Faculty Verification
          </Button>
        </div>
      </form>
    </div>
  );
};

