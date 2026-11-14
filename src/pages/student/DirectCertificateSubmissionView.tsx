import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DirectCertificate, DirectCertificateType } from '../../types';
import {
  submitDirectCertificate,
  getDirectCertificatesForStudent,
  syncDirectCertificatesFromFirebase,
  subscribeToDirectCertificates,
} from '../../services/firebase/firestoreService';
import { uploadToCloudinary } from '../../services/cloudinary/cloudinaryService';
import { Button } from '../../components/common/Button';
import {
  Award,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  XCircle,
  Eye,
  Calendar,
  ExternalLink,
} from 'lucide-react';

const CERTIFICATE_TYPES: Array<{ id: DirectCertificateType; label: string }> = [
  { id: 'HACKATHON', label: 'Hackathon Certificate' },
  { id: 'NPTEL_COURSE', label: 'NPTEL / Online Course Certificate' },
  { id: 'INTERNSHIP', label: 'Internship Certificate' },
  { id: 'WORKSHOP', label: 'Workshop / Hands-on Training Certificate' },
  { id: 'PAPER_PRESENTATION', label: 'Paper / Project Presentation Certificate' },
  { id: 'SYMPOSIUM_COMPETITION', label: 'Symposium / Technical Competition Certificate' },
  { id: 'OTHER', label: 'Other Institutional Certificate' },
];

export const DirectCertificateSubmissionView: React.FC = () => {
  const { studentData } = useAuth();
  if (!studentData) return null;

  // Form states
  const [certType, setCertType] = useState<DirectCertificateType>('HACKATHON');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [certificatePublicId, setCertificatePublicId] = useState('');

  // UI states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Certificates list state
  const [myCertificates, setMyCertificates] = useState<DirectCertificate[]>(() =>
    getDirectCertificatesForStudent(studentData.registrationNumber)
  );
  const [previewCert, setPreviewCert] = useState<DirectCertificate | null>(null);

  useEffect(() => {
    void syncDirectCertificatesFromFirebase().then(() => {
      setMyCertificates(getDirectCertificatesForStudent(studentData.registrationNumber));
    });
    const unsub = subscribeToDirectCertificates(() => {
      setMyCertificates(getDirectCertificatesForStudent(studentData.registrationNumber));
    });
    return () => unsub();
  }, [studentData.registrationNumber]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Certificate file size must be within 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setError(null);

    try {
      const res = await uploadToCloudinary(file, 'certificates', (pct) => {
        setUploadProgress(pct);
      });
      setCertificateUrl(res.url);
      setCertificatePublicId(res.publicId);
      setSuccessMsg('✓ Certificate file uploaded successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload certificate to cloud storage.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setError('Course / Event / Organization name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a 1-2 line description of your certificate or achievement.');
      return;
    }
    if (!issueDate) {
      setError('Please provide the certificate issue date / completion date.');
      return;
    }
    if (!certificateUrl) {
      setError('Certificate file upload is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const typeObj = CERTIFICATE_TYPES.find(t => t.id === certType);
      await submitDirectCertificate({
        studentId: studentData.id,
        studentRegNo: studentData.registrationNumber,
        studentName: studentData.fullName,
        department: studentData.department,
        academicYear: studentData.academicYear,
        section: studentData.section,
        certificateType: certType,
        certificateTypeName: typeObj?.label || 'Certificate',
        title: title.trim(),
        description: description.trim(),
        issueDate,
        certificateUrl,
        certificatePublicId,
      });

      setSuccessMsg('✓ Certificate submitted directly for faculty verification!');
      setTitle('');
      setDescription('');
      setIssueDate('');
      setCertificateUrl('');
      setCertificatePublicId('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit certificate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="text-amber-400" size={22} />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Single-Step Direct Upload
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">Certificate & Document Submissions</h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Upload your Hackathon, NPTEL, Internship, or Workshop certificates directly.
              This single-step submission routes directly to your department staff & administration for instant verification.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur-xs p-4 text-center shrink-0 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">Total Submitted</span>
            <span className="text-2xl font-black text-white">{myCertificates.length}</span>
          </div>
        </div>
      </div>

      {/* Submission Form Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <UploadCloud className="text-blue-600" size={20} />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Submit New Certificate</h2>
            <p className="text-[11px] text-slate-500">Provide achievement details and attach document (max 5MB)</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Certificate Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Certificate Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value as DirectCertificateType)}
                className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {CERTIFICATE_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Course / Event / Org Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Event / Course / Organization Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Smart India Hackathon 2026 / Python by IIT Madras"
                className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Brief Description (1-2 lines) <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summarize your role, score, prize or learning outcome..."
                className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {/* Issue Date & Upload */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Issue / Completion Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Certificate Document (Image/PDF, max 5MB) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition-colors">
                    <UploadCloud size={15} />
                    <span>{isUploading ? `Uploading (${uploadProgress}%)...` : certificateUrl ? 'Change Document' : 'Choose File'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  {certificateUrl && (
                    <a
                      href={certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Eye size={13} /> Preview
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isSubmitting || isUploading || !certificateUrl}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Certificate for Verification'}
            </Button>
          </div>
        </form>
      </div>

      {/* Submitted Certificates List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">My Submitted Certificates ({myCertificates.length})</h2>
            <p className="text-[11px] text-slate-500">Track verification status from department faculty and administration</p>
          </div>
        </div>

        {myCertificates.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
              <Award size={24} />
            </div>
            <p className="text-xs font-bold text-slate-700">No Certificates Submitted Yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Use the form above to submit your first certificate.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {myCertificates.map((cert) => (
              <div
                key={cert.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      {cert.certificateNumber}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      {cert.certificateTypeName}
                    </span>
                    <span className="text-[10px] text-slate-400">• Issued: {cert.issueDate}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{cert.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{cert.description}</p>
                  {cert.remarks && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      <span className="font-bold">Faculty Remarks:</span> {cert.remarks}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  {cert.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Clock size={12} /> Pending Verification
                    </span>
                  )}
                  {cert.status === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 size={12} /> Verified ✓
                    </span>
                  )}
                  {cert.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      <XCircle size={12} /> Rejected
                    </span>
                  )}

                  <a
                    href={cert.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-blue-500 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors shadow-2xs"
                  >
                    <ExternalLink size={13} />
                    <span>View File</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
