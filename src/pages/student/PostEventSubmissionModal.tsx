import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { EventApplication } from '../../types';
import { submitPostEventDocuments } from '../../services/firebase/firestoreService';
import { uploadToCloudinary } from '../../services/cloudinary/cloudinaryService';
import {
  Award,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Camera,
  FileText,
} from 'lucide-react';

interface PostEventSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: EventApplication;
  onSuccess: (updated: EventApplication) => void;
}

export const PostEventSubmissionModal: React.FC<PostEventSubmissionModalProps> = ({
  isOpen,
  onClose,
  application,
  onSuccess,
}) => {
  const [actualParticipationDetails, setActualParticipationDetails] = useState(
    application.actualParticipationDetails || ''
  );
  const [actualAttendanceMarked, setActualAttendanceMarked] = useState(
    application.actualAttendanceMarked ?? true
  );
  const [prizeWon, setPrizeWon] = useState<boolean>(application.prizeWon ?? false);
  const [prizeCategory, setPrizeCategory] = useState(application.prizeCategory || '1st Prize');
  const [prizeName, setPrizeName] = useState(application.prizeName || '');
  const [achievementDescription, setAchievementDescription] = useState(
    application.achievementDescription || ''
  );

  // Upload States
  const [participationCertUrl, setParticipationCertUrl] = useState(
    application.participationCertUrl || ''
  );
  const [winnerCertUrl, setWinnerCertUrl] = useState(application.winnerCertUrl || '');
  const [uploadingParticipation, setUploadingParticipation] = useState(false);
  const [uploadingWinner, setUploadingWinner] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'participation' | 'winner'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'participation') setUploadingParticipation(true);
    else setUploadingWinner(true);
    setError(null);

    try {
      const res = await uploadToCloudinary(file, 'certificates');
      if (type === 'participation') setParticipationCertUrl(res.url);
      else setWinnerCertUrl(res.url);
    } catch (err: any) {
      setError(err.message || 'Certificate upload failed.');
    } finally {
      if (type === 'participation') setUploadingParticipation(false);
      else setUploadingWinner(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!actualParticipationDetails.trim()) {
      setError('Please provide actual participation details.');
      return;
    }

    // Conditional certificate requirements per Section 10
    if (prizeWon && !winnerCertUrl) {
      setError('Winner Certificate is strictly required when Prize Won is marked as Yes.');
      return;
    }
    if (prizeWon && prizeCategory === 'Other' && !prizeName.trim()) {
      setError('Please enter the prize name.');
      return;
    }
    if (!participationCertUrl) {
      setError('Participation Certificate is required for every 100% submission.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        actualParticipationDetails: actualParticipationDetails.trim(),
        actualAttendanceMarked,
        prizeWon,
        achievementDescription: achievementDescription.trim(),
        participationCertUrl,
      };

      if (prizeWon) {
        payload.prizeCategory = prizeCategory;
        if (winnerCertUrl) payload.winnerCertUrl = winnerCertUrl;
        if (prizeCategory === 'Other' && prizeName.trim()) {
          payload.prizeName = prizeName.trim();
        }
      }

      const updated = submitPostEventDocuments(application.id, payload);

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit post-event certificates.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Post-Event Verification & Certificates"
      subtitle={`Application: ${application.applicationNumber} - ${application.eventName}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-1">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span>Event: {application.eventName}</span>
            <span className="text-blue-700">{application.eventCategory}</span>
          </div>
          <p className="text-slate-500">
            {application.institutionName} • Pre-Approved by {application.preApprovedByName || 'Faculty'}
          </p>
        </div>

        {/* 1. Actual Participation Details */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Actual Participation & Outcomes <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={actualParticipationDetails}
            onChange={(e) => setActualParticipationDetails(e.target.value)}
            placeholder="Describe your session, rounds cleared, presentation topic, or challenge tackled..."
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
          />
        </div>

        {/* 2. Prize Won Toggle */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            Did you win a prize or award in this event? <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <label
              className={`flex-1 flex items-center justify-center py-2.5 px-3 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                prizeWon
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <input
                type="radio"
                name="prizeWon"
                checked={prizeWon}
                onChange={() => setPrizeWon(true)}
                className="hidden"
              />
              <span>🏆 Yes, Won a Prize</span>
            </label>

            <label
              className={`flex-1 flex items-center justify-center py-2.5 px-3 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                !prizeWon
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <input
                type="radio"
                name="prizeWon"
                checked={!prizeWon}
                onChange={() => setPrizeWon(false)}
                className="hidden"
              />
              <span>📜 Participated Only</span>
            </label>
          </div>

          {prizeWon && (
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prize Category / Standing <span className="text-rose-500">*</span>
                </label>
                <select
                  value={prizeCategory}
                  onChange={(e) => setPrizeCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                >
                  <option value="1st Prize (Winner)">1st Prize (Winner)</option>
                  <option value="2nd Prize (Runner Up)">2nd Prize (Runner Up)</option>
                  <option value="3rd Prize">3rd Prize</option>
                  <option value="Consolation Prize">Consolation Prize</option>
                  <option value="Best Innovation Award">Best Innovation Award</option>
                  <option value="Special Jury Mention">Special Jury Mention</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {prizeCategory === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prize Name *</label>
                  <input value={prizeName} onChange={(e) => setPrizeName(e.target.value)} required className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cash Prize / Reward Description
                </label>
                <input
                  type="text"
                  value={achievementDescription}
                  onChange={(e) => setAchievementDescription(e.target.value)}
                  placeholder="e.g. Rs. 10,000 + Certificate + Trophy"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Certificate Uploads */}
        <div className="space-y-4 pt-1">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Required Certificate Verification
          </h4>

          {/* Winner Certificate (Required if Prize Won = Yes) */}
          {prizeWon && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900 block">
                  Official Winner Certificate (Image or PDF) <span className="text-rose-500">*</span>
                </label>
                {winnerCertUrl && (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Uploaded
                  </span>
                )}
              </div>
              <label className="block cursor-pointer">
                <div className="flex items-center justify-center gap-2 p-3 bg-white border border-dashed border-amber-300 hover:border-amber-400 rounded-xl text-xs font-bold text-amber-900 transition-colors">
                  <UploadCloud size={16} />
                  <span>
                    {uploadingWinner
                      ? 'Uploading Winner Certificate...'
                      : winnerCertUrl
                      ? 'Replace Winner Certificate'
                      : 'Upload Winner Certificate'}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleUpload(e, 'winner')}
                  disabled={uploadingWinner}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Participation Certificate (Required for every 100% submission) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 block">
                Participation Certificate (Image or PDF) <span className="text-rose-500">*</span>
              </label>
              {participationCertUrl && (
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Uploaded
                </span>
              )}
            </div>
            <label className="block cursor-pointer">
              <div className="flex items-center justify-center gap-2 p-3 bg-white border border-dashed border-slate-300 hover:border-slate-400 rounded-xl text-xs font-bold text-slate-700 transition-colors">
                <UploadCloud size={16} />
                <span>
                  {uploadingParticipation
                    ? 'Uploading Participation Certificate...'
                    : participationCertUrl
                    ? 'Replace Participation Certificate'
                    : 'Upload Participation Certificate'}
                </span>
              </div>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleUpload(e, 'participation')}
                disabled={uploadingParticipation}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isLoading}
            leftIcon={<FileCheck size={16} />}
          >
            Submit for 100% Final Verification
          </Button>
        </div>
      </form>
    </Modal>
  );
};
