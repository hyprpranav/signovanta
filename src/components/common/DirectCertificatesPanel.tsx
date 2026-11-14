import React, { useState, useEffect, useMemo } from 'react';
import { DirectCertificate, DirectCertificateType, UserRole } from '../../types';
import {
  getAllDirectCertificates,
  syncDirectCertificatesFromFirebase,
  subscribeToDirectCertificates,
  verifyDirectCertificate,
  rejectDirectCertificate,
  deleteDirectCertificate,
} from '../../services/firebase/firestoreService';
import { PinVerificationModal } from './PinVerificationModal';
import { Button } from './Button';
import { Modal } from './Modal';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  ExternalLink,
  User,
  Building,
  Calendar,
  AlertCircle,
  Download,
  FileText,
} from 'lucide-react';

interface DirectCertificatesPanelProps {
  editorUid: string;
  editorName: string;
  editorRole: UserRole;
  isMasterAdmin?: boolean;
}

export const DirectCertificatesPanel: React.FC<DirectCertificatesPanelProps> = ({
  editorUid,
  editorName,
  editorRole,
  isMasterAdmin = false,
}) => {
  const [certificates, setCertificates] = useState<DirectCertificate[]>(() =>
    getAllDirectCertificates()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Preview Modal
  const [previewCert, setPreviewCert] = useState<DirectCertificate | null>(null);

  // Remarks Action Modal (Verify or Reject)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'VERIFY' | 'REJECT';
    cert: DirectCertificate | null;
    remarks: string;
    isSubmitting: boolean;
    error: string | null;
  }>({
    isOpen: false,
    type: 'VERIFY',
    cert: null,
    remarks: '',
    isSubmitting: false,
    error: null,
  });

  // Delete Guard Modal (PIN: 927624)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    certId: string | null;
    title: string;
    studentName: string;
  }>({
    isOpen: false,
    certId: null,
    title: '',
    studentName: '',
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    void syncDirectCertificatesFromFirebase().then((certs) => {
      setCertificates(certs);
    });

    const unsubscribe = subscribeToDirectCertificates((certs) => {
      setCertificates(certs);
    });

    return () => unsubscribe();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = certificates.length;
    const pending = certificates.filter((c) => c.status === 'PENDING').length;
    const verified = certificates.filter((c) => c.status === 'VERIFIED').length;
    const rejected = certificates.filter((c) => c.status === 'REJECTED').length;
    return { total, pending, verified, rejected };
  }, [certificates]);

  // Filtered certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        c.studentRegNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'ALL' || c.certificateType === typeFilter;
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [certificates, searchTerm, typeFilter, statusFilter]);

  // Handle Verify Execution
  const handleConfirmAction = async () => {
    if (!actionModal.cert) return;

    setActionModal((prev) => ({ ...prev, isSubmitting: true, error: null }));
    try {
      if (actionModal.type === 'VERIFY') {
        await verifyDirectCertificate(
          actionModal.cert.id,
          editorUid,
          editorName,
          editorRole,
          actionModal.remarks
        );
        showNotification(
          'success',
          `✓ Certificate "${actionModal.cert.title}" verified successfully.`
        );
      } else {
        await rejectDirectCertificate(
          actionModal.cert.id,
          editorUid,
          editorName,
          editorRole,
          actionModal.remarks
        );
        showNotification(
          'success',
          `Certificate "${actionModal.cert.title}" marked as rejected.`
        );
      }
      setActionModal({
        isOpen: false,
        type: 'VERIFY',
        cert: null,
        remarks: '',
        isSubmitting: false,
        error: null,
      });
    } catch (err: any) {
      setActionModal((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err?.message || 'Failed to update certificate status.',
      }));
    }
  };

  // Handle Permanent Delete Execution
  const handleDeleteSuccess = async () => {
    if (!deleteModal.certId) return;
    await deleteDirectCertificate(deleteModal.certId);
    showNotification('success', '✓ Certificate permanently deleted.');
    setDeleteModal({ isOpen: false, certId: null, title: '', studentName: '' });
  };

  // Export Direct Certificates to CSV
  const handleExportCSV = () => {
    if (certificates.length === 0) {
      showNotification('error', 'No certificates to export.');
      return;
    }
    const headers = [
      'Certificate ID',
      'Reg No',
      'Student Name',
      'Section',
      'Category',
      'Title',
      'Description',
      'Issue Date',
      'Status',
      'Verified By',
      'Verified At',
      'Remarks',
      'Document URL',
    ];

    const rows = certificates.map((c) => [
      `"${c.certificateNumber || c.id}"`,
      `"${c.studentRegNo}"`,
      `"${c.studentName}"`,
      `"${c.section}"`,
      `"${c.certificateTypeName || c.certificateType}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${(c.description || '').replace(/"/g, '""')}"`,
      `"${c.issueDate || ''}"`,
      `"${c.status}"`,
      `"${c.verifiedByName || ''}"`,
      `"${c.verifiedAt || ''}"`,
      `"${(c.remarks || '').replace(/"/g, '""')}"`,
      `"${c.certificateUrl}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `signovanta_direct_certificates_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('success', '✓ Direct certificates exported to CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-2 shadow-sm animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30">
              <Award size={20} />
            </span>
            <span className="text-xs uppercase tracking-wider font-bold text-indigo-300">
              Direct Submissions Hub
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Single-Step Certificate Verifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Inspect, authenticate, and verify student certificates submitted
            directly for Hackathons, NPTEL courses, Internships, Workshops, and
            Symposiums.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <Download size={14} className="mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Direct Certificates
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {metrics.total}
          </p>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1.5">
            <Clock size={13} /> Awaiting Review
          </span>
          <p className="text-2xl font-black text-amber-900 mt-1">
            {metrics.pending}
          </p>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Verified (100%)
          </span>
          <p className="text-2xl font-black text-emerald-900 mt-1">
            {metrics.verified}
          </p>
        </div>

        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block flex items-center gap-1.5">
            <XCircle size={13} /> Rejected
          </span>
          <p className="text-2xl font-black text-rose-900 mt-1">
            {metrics.rejected}
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by student name, register number, or event title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold shrink-0">
            <Filter size={14} /> Filter:
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories</option>
            <option value="HACKATHON">Hackathon</option>
            <option value="NPTEL_COURSE">NPTEL / Online Course</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="WORKSHOP">Workshop</option>
            <option value="PAPER_PRESENTATION">Paper Presentation</option>
            <option value="SYMPOSIUM_COMPETITION">Symposium</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Certificates Cards Grid / List */}
      {filteredCertificates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
          <Award className="mx-auto text-slate-300 mb-3" size={48} />
          <h3 className="text-base font-bold text-slate-700">
            No direct certificate submissions found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try modifying your search query or filters to locate certificates.'
              : 'Direct certificate submissions made by students will appear here in real time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCertificates.map((cert) => {
            const isPending = cert.status === 'PENDING';
            const isVerified = cert.status === 'VERIFIED';
            const isRejected = cert.status === 'REJECTED';

            return (
              <div
                key={cert.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Student & Certificate Meta */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {cert.studentRegNo}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        {cert.studentName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        • Section {cert.section} • {cert.department}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({cert.certificateNumber || cert.id.slice(0, 8)})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Award size={11} /> {cert.certificateTypeName || cert.certificateType}
                      </span>

                      {cert.issueDate && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar size={12} /> Issued: {cert.issueDate}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 pt-1">
                      {cert.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {cert.description}
                    </p>

                    {/* Verification / Remarks metadata */}
                    {cert.remarks && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 mt-2">
                        <span className="font-bold text-slate-900">
                          Faculty Remarks:
                        </span>{' '}
                        {cert.remarks}
                        {cert.verifiedByName && (
                          <span className="text-slate-500 block text-[11px] mt-0.5">
                            Verified by: {cert.verifiedByName} on{' '}
                            {cert.verifiedAt
                              ? new Date(cert.verifiedAt).toLocaleDateString()
                              : 'Recent'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Status badge & Actions */}
                  <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                    <div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={12} /> Pending Verification
                        </span>
                      )}
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} /> Verified & Authenticated
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* View document button */}
                      <button
                        type="button"
                        onClick={() => setPreviewCert(cert)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <Eye size={13} /> View Document
                      </button>

                      {/* Verify button */}
                      {isPending && (
                        <button
                          type="button"
                          onClick={() =>
                            setActionModal({
                              isOpen: true,
                              type: 'VERIFY',
                              cert,
                              remarks: 'Verified & Approved.',
                              isSubmitting: false,
                              error: null,
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                        >
                          <CheckCircle2 size={13} /> Verify
                        </button>
                      )}

                      {/* Reject button */}
                      {isPending && (
                        <button
                          type="button"
                          onClick={() =>
                            setActionModal({
                              isOpen: true,
                              type: 'REJECT',
                              cert,
                              remarks: '',
                              isSubmitting: false,
                              error: null,
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      )}

                      {/* Delete button (Guarded with PIN: 927624) */}
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            certId: cert.id,
                            title: cert.title,
                            studentName: cert.studentName,
                          })
                        }
                        className="inline-flex items-center gap-1 p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Certificate (2-Step PIN Required)"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Document Modal */}
      {previewCert && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewCert(null)}
          title={`Certificate: ${previewCert.title}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900">
                  {previewCert.studentName}
                </span>{' '}
                ({previewCert.studentRegNo}) • Section {previewCert.section}
              </div>
              <a
                href={previewCert.certificateUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold"
              >
                Open in new window <ExternalLink size={12} />
              </a>
            </div>

            <div className="bg-slate-900 rounded-2xl p-2 min-h-[400px] flex items-center justify-center overflow-hidden">
              {previewCert.certificateUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewCert.certificateUrl}
                  title={previewCert.title}
                  className="w-full h-[500px] rounded-xl bg-white"
                />
              ) : (
                <img
                  src={previewCert.certificateUrl}
                  alt={previewCert.title}
                  className="max-h-[500px] max-w-full object-contain rounded-xl"
                />
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setPreviewCert(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Verify / Reject Remarks Action Modal */}
      {actionModal.isOpen && actionModal.cert && (
        <Modal
          isOpen={true}
          onClose={() =>
            !actionModal.isSubmitting &&
            setActionModal((prev) => ({ ...prev, isOpen: false }))
          }
          title={
            actionModal.type === 'VERIFY'
              ? 'Verify & Approve Certificate'
              : 'Reject Certificate Submission'
          }
        >
          <div className="space-y-4">
            {actionModal.error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{actionModal.error}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p>
                <span className="font-bold text-slate-700">Student:</span>{' '}
                {actionModal.cert.studentName} ({actionModal.cert.studentRegNo})
              </p>
              <p>
                <span className="font-bold text-slate-700">Certificate:</span>{' '}
                {actionModal.cert.title}
              </p>
              <p>
                <span className="font-bold text-slate-700">Type:</span>{' '}
                {actionModal.cert.certificateTypeName ||
                  actionModal.cert.certificateType}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {actionModal.type === 'VERIFY'
                  ? 'Verification Remarks (Optional):'
                  : 'Rejection Reason / Remarks (Required):'}
              </label>
              <textarea
                value={actionModal.remarks}
                onChange={(e) =>
                  setActionModal((prev) => ({ ...prev, remarks: e.target.value }))
                }
                rows={3}
                placeholder={
                  actionModal.type === 'VERIFY'
                    ? 'e.g. Verified from official organizing body certificate portal.'
                    : 'e.g. Certificate is blurred or does not show student name clearly.'
                }
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setActionModal((prev) => ({ ...prev, isOpen: false }))
                }
                disabled={actionModal.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant={actionModal.type === 'VERIFY' ? 'primary' : 'danger'}
                size="sm"
                onClick={handleConfirmAction}
                isLoading={actionModal.isSubmitting}
              >
                {actionModal.type === 'VERIFY'
                  ? 'Confirm Verification'
                  : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2-Step PIN Deletion Modal */}
      {deleteModal.isOpen && (
        <PinVerificationModal
          isOpen={true}
          onClose={() =>
            setDeleteModal({ isOpen: false, certId: null, title: '', studentName: '' })
          }
          onSuccess={handleDeleteSuccess}
          title="Delete Direct Certificate"
          description={`You are about to permanently delete the direct certificate "${deleteModal.title}" submitted by ${deleteModal.studentName}. This action will delete the record from Firebase Firestore and cannot be undone.`}
          confirmButtonText="Delete Certificate Permanently"
        />
      )}
    </div>
  );
};
