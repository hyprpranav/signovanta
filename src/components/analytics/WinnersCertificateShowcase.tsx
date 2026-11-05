import React, { useState, useMemo } from 'react';
import { EventApplication } from '../../types';
import { Trophy, Award, ExternalLink, Calendar, MapPin, CheckCircle2, Search, Filter, Eye } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface WinnersCertificateShowcaseProps {
  applications: EventApplication[];
  title?: string;
  subtitle?: string;
}

export const WinnersCertificateShowcase: React.FC<WinnersCertificateShowcaseProps> = ({
  applications,
  title = '🏆 Hall of Fame & Winners Showcase',
  subtitle = 'Verified prize winners, trophies and certificates across III Year ECE',
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewCertUrl, setPreviewCertUrl] = useState<{ url: string; title: string; student: string } | null>(null);

  // Filter only applications that won prizes or have certificates submitted
  const winnersList = useMemo(() => {
    return applications.filter((app) => {
      const hasWon = app.prizeWon || app.status === 'COMPLETED';
      if (!hasWon) return false;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.studentName.toLowerCase().includes(q) ||
        app.studentRegNo.toLowerCase().includes(q) ||
        app.eventName.toLowerCase().includes(q) ||
        (app.prizeCategory && app.prizeCategory.toLowerCase().includes(q));

      const matchesSection = selectedSection === 'ALL' || app.section === selectedSection;

      return matchesSearch && matchesSection;
    });
  }, [applications, searchQuery, selectedSection]);

  const uniqueSections = ['ALL', 'III Year ECE A', 'III Year ECE B', 'III Year ECE C', 'III Year ECE D'];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
              <Trophy size={18} className="text-amber-600" />
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{title}</h2>
          </div>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Section Filter Pills */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
            {uniqueSections.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSection(sec)}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  selectedSection === sec
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sec === 'ALL' ? 'All Sections' : sec.replace('III Year ', '')}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or event..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Grid of Winners */}
      {winnersList.length === 0 ? (
        <div className="text-center py-10 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <Trophy size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-600">No winner records found for the selected filter.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Verified student achievements and prize awards will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {winnersList.map((app) => (
            <div
              key={app.id}
              className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-amber-300 hover:shadow-md rounded-2xl p-4 sm:p-5 transition-all space-y-3 relative overflow-hidden"
            >
              {/* Gold ribbon header for prize winner */}
              {app.prizeWon && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                  <Trophy size={11} className="text-amber-200" />
                  <span>{app.prizeCategory || 'Prize Winner'}</span>
                </div>
              )}

              {/* Student Identity */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {app.studentRegNo}
                  </span>
                  <span className="text-xs font-bold text-slate-700">{app.section}</span>
                </div>
                <h3 className="text-sm font-black text-slate-900">{app.studentName}</h3>
              </div>

              {/* Event Details */}
              <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{app.eventName}</span>
                  <span className="text-[11px] text-indigo-700 font-semibold">{app.eventCategory}</span>
                </div>
                <p className="text-slate-500 text-[11px] flex items-center gap-1">
                  <MapPin size={11} className="shrink-0" />
                  <span>{app.institutionName} • {app.eventLocation}</span>
                </p>
                {app.achievementDescription && (
                  <p className="text-slate-600 text-[11px] italic pt-1 border-t border-slate-50">
                    "{app.achievementDescription}"
                  </p>
                )}
              </div>

              {/* Verification & Certificates Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="text-[11px] text-slate-500">
                  {app.completedByName ? (
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 size={12} />
                      Verified by: {app.completedByName}
                    </span>
                  ) : (
                    <span>Pre-Approved: {app.preApprovedByName || 'Faculty In-Charge'}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {app.winnerCertUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewCertUrl({
                          url: app.winnerCertUrl!,
                          title: `Winner Certificate: ${app.eventName}`,
                          student: `${app.studentName} (${app.studentRegNo})`,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Trophy size={12} className="text-amber-600" />
                      <span>Winner Cert</span>
                    </button>
                  )}

                  {app.participationCertUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewCertUrl({
                          url: app.participationCertUrl!,
                          title: `Participation Certificate: ${app.eventName}`,
                          student: `${app.studentName} (${app.studentRegNo})`,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Eye size={12} className="text-blue-600" />
                      <span>Participation</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Preview Modal */}
      {previewCertUrl && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewCertUrl(null)}
          title={previewCertUrl.title}
          subtitle={`Student: ${previewCertUrl.student}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="w-full max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-900 flex items-center justify-center p-2">
              <img
                src={previewCertUrl.url}
                alt={previewCertUrl.title}
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-lg"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <a
                href={previewCertUrl.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                <span>Open Full Resolution in New Window</span>
                <ExternalLink size={13} />
              </a>
              <button
                type="button"
                onClick={() => setPreviewCertUrl(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
