import React, { useMemo } from 'react';
import { EventApplication, Student } from '../../types';
import { Trophy, Award, BarChart3, PieChart, Users, TrendingUp, CheckCircle2, Star, Calendar } from 'lucide-react';

interface EventParticipationAnalyticsProps {
  students: Student[];
  applications: EventApplication[];
  isStaffOrAdminView?: boolean;
}

export const EventParticipationAnalytics: React.FC<EventParticipationAnalyticsProps> = ({
  students,
  applications,
}) => {
  // 1. Core Mathematical Metrics
  const totalStudentsCount = students.length;

  // Set of student RegNos who submitted at least one application
  const uniqueParticipantsSet = useMemo(() => {
    return new Set(applications.map((a) => a.studentRegNo.toUpperCase().trim()));
  }, [applications]);

  const uniqueParticipatedCount = uniqueParticipantsSet.size;
  const participationRate = totalStudentsCount > 0
    ? Math.round((uniqueParticipatedCount / totalStudentsCount) * 100)
    : 0;

  // Set of student RegNos who won at least one event
  const uniqueWinnersSet = useMemo(() => {
    const winners = applications.filter((a) => a.prizeWon || (a.status === 'COMPLETED' && a.winnerCertUrl));
    return new Set(winners.map((a) => a.studentRegNo.toUpperCase().trim()));
  }, [applications]);

  const uniqueWinnersCount = uniqueWinnersSet.size;
  const winRate = uniqueParticipatedCount > 0
    ? Math.round((uniqueWinnersCount / uniqueParticipatedCount) * 100)
    : 0;

  const totalCompletedApps = applications.filter((a) => a.status === 'COMPLETED').length;
  const totalPreApprovedApps = applications.filter((a) => a.status === 'PRE_APPROVED').length;
  const totalPrizesWon = applications.filter((a) => a.prizeWon).length;

  // 2. Section-wise Comparative Analysis
  const sections = ['III Year ECE A', 'III Year ECE B', 'III Year ECE C', 'III Year ECE D'];

  const sectionMetrics = useMemo(() => {
    return sections.map((secName) => {
      const secStudents = students.filter((s) => s.section === secName);
      const secTotal = secStudents.length;

      const secParticipants = secStudents.filter((s) =>
        uniqueParticipantsSet.has(s.registrationNumber.toUpperCase().trim())
      ).length;

      const secWinners = secStudents.filter((s) =>
        uniqueWinnersSet.has(s.registrationNumber.toUpperCase().trim())
      ).length;

      const secWinPercent = secParticipants > 0
        ? Math.round((secWinners / secParticipants) * 100)
        : 0;

      const secParticipationPercent = secTotal > 0
        ? Math.round((secParticipants / secTotal) * 100)
        : 0;

      return {
        section: secName,
        label: secName.replace('III Year ', ''),
        total: secTotal,
        participated: secParticipants,
        won: secWinners,
        participationPercent: secParticipationPercent,
        winPercent: secWinPercent,
      };
    });
  }, [students, uniqueParticipantsSet, uniqueWinnersSet]);

  // 3. Event-Wise Winning Mathematical Analysis
  const eventWiseAnalysis = useMemo(() => {
    const map = new Map<string, {
      eventName: string;
      category: string;
      institution: string;
      participants: Set<string>;
      winners: Array<{ name: string; regNo: string; section: string; prize: string }>;
    }>();

    applications.forEach((app) => {
      const key = app.eventName.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          eventName: app.eventName,
          category: app.eventCategory,
          institution: app.institutionName,
          participants: new Set(),
          winners: [],
        });
      }
      const entry = map.get(key)!;
      entry.participants.add(app.studentRegNo);

      if (app.prizeWon) {
        entry.winners.push({
          name: app.studentName,
          regNo: app.studentRegNo,
          section: app.section,
          prize: app.prizeCategory || 'Prize Winner',
        });
      }
    });

    return Array.from(map.values()).map((item) => {
      const pCount = item.participants.size;
      const wCount = item.winners.length;
      const winRatio = pCount > 0 ? Math.round((wCount / pCount) * 100) : 0;
      return {
        ...item,
        participantCount: pCount,
        winnerCount: wCount,
        winRatio,
      };
    }).sort((a, b) => b.winnerCount - a.winnerCount || b.participantCount - a.participantCount);
  }, [applications]);

  // Donut Chart calculations
  const nonWinnerParticipants = Math.max(uniqueParticipatedCount - uniqueWinnersCount, 0);
  const remainingCohort = Math.max(totalStudentsCount - uniqueParticipatedCount, 0);

  const pctWinners = totalStudentsCount > 0 ? (uniqueWinnersCount / totalStudentsCount) * 100 : 0;
  const pctParticipants = totalStudentsCount > 0 ? (nonWinnerParticipants / totalStudentsCount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Mathematical KPI Header Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Total 3rd Year ECE Cohort
            </span>
            <Users size={18} className="text-blue-600" />
          </div>
          <span className="text-3xl font-black text-slate-900 block">{totalStudentsCount}</span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">
            Across 4 Academic Sections (A, B, C, D)
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
              Students Participated
            </span>
            <BarChart3 size={18} className="text-blue-600" />
          </div>
          <span className="text-3xl font-black text-blue-700 block">{uniqueParticipatedCount}</span>
          <span className="text-xs font-bold text-blue-600 mt-1 block">
            {participationRate}% of total 3rd Year cohort
          </span>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
              Prize Winners (Won)
            </span>
            <Trophy size={18} className="text-amber-600" />
          </div>
          <span className="text-3xl font-black text-amber-900 block">{uniqueWinnersCount}</span>
          <span className="text-xs font-bold text-amber-800 mt-1 block">
            {winRate}% Win Conversion Ratio
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
              Total Prizes & Awards
            </span>
            <Award size={18} className="text-emerald-600" />
          </div>
          <span className="text-3xl font-black text-emerald-700 block">{totalPrizesWon}</span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">
            {totalCompletedApps} Verified 100% completions
          </span>
        </div>
      </div>

      {/* Two Main Charts: Donut Pie Chart & Section Bar Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Participated vs Won Pie / Donut Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <PieChart size={17} className="text-indigo-600" />
                <span>Participation & Victory Distribution</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mathematical proportion of winners against participants and cohort
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            {/* SVG Interactive Donut */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-slate-100"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Cohort not participated yet */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-slate-200"
                  strokeWidth="12"
                  strokeDasharray={`${(remainingCohort / Math.max(totalStudentsCount, 1)) * 238.7} 238.7`}
                  strokeDashoffset="0"
                  fill="transparent"
                />
                {/* Participated */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-blue-500"
                  strokeWidth="12"
                  strokeDasharray={`${(pctParticipants / 100) * 238.7} 238.7`}
                  strokeDashoffset={`${-((remainingCohort / Math.max(totalStudentsCount, 1)) * 238.7)}`}
                  fill="transparent"
                />
                {/* Winners Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-amber-500"
                  strokeWidth="14"
                  strokeDasharray={`${(pctWinners / 100) * 238.7} 238.7`}
                  strokeDashoffset={`${-(((remainingCohort + nonWinnerParticipants) / Math.max(totalStudentsCount, 1)) * 238.7)}`}
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner Center Statistics */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 leading-none">{winRate}%</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Win Rate
                </span>
              </div>
            </div>

            {/* Legend & Exact Statistics */}
            <div className="space-y-3 w-full sm:w-auto text-xs font-semibold text-slate-700">
              <div className="flex items-center justify-between gap-4 p-2 bg-amber-50/80 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-xs" />
                  <span className="font-bold text-amber-950">Prize Winners</span>
                </div>
                <strong className="text-amber-950">{uniqueWinnersCount} ({winRate}%)</strong>
              </div>

              <div className="flex items-center justify-between gap-4 p-2 bg-blue-50/80 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-xs" />
                  <span className="font-bold text-blue-950">Participation Completed</span>
                </div>
                <strong className="text-blue-950">{nonWinnerParticipants}</strong>
              </div>

              <div className="flex items-center justify-between gap-4 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-300" />
                  <span className="text-slate-600">Pending Participation</span>
                </div>
                <strong className="text-slate-700">{remainingCohort}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Section-Wise Participation vs Winners Comparative Bar Graph */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 size={17} className="text-blue-600" />
                <span>Section-Wise Performance (A, B, C, D)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparative bar graph of Participated vs Won by ECE 3rd Year section
              </p>
            </div>
            {/* Small Legend */}
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Participated
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Won Prize
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {sectionMetrics.map((sec) => (
              <div key={sec.section} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800">{sec.label}</span>
                    <span className="text-[11px] text-slate-400">({sec.total} students)</span>
                  </div>
                  <div className="text-[11px] font-bold">
                    <span className="text-blue-700">{sec.participated} Participated</span>
                    <span className="text-slate-300 mx-1.5">•</span>
                    <span className="text-amber-700">🏆 {sec.won} Won</span>
                  </div>
                </div>

                {/* Double Bar Display */}
                <div className="space-y-1">
                  {/* Participated Bar */}
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex items-center">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max((sec.participated / Math.max(sec.total, 1)) * 100, sec.participated > 0 ? 5 : 0)}%` }}
                      title={`Participated: ${sec.participated}`}
                    />
                  </div>
                  {/* Winners Bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex items-center">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max((sec.won / Math.max(sec.total, 1)) * 100, sec.won > 0 ? 5 : 0)}%` }}
                      title={`Winners: ${sec.won}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Event-Wise Winning Mathematical Analysis Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy size={16} className="text-amber-600" />
              <span>Event-Wise Winning & Participation Mathematical Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact mathematical counts of participants and winners per academic competition
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            {eventWiseAnalysis.length} Unique Events Analyzed
          </span>
        </div>

        {eventWiseAnalysis.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No event applications submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Event Name & Host Institution</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Participants</th>
                  <th className="py-3 px-4 text-center">Winners</th>
                  <th className="py-3 px-4 text-center">Win Ratio</th>
                  <th className="py-3 px-4">Winning Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventWiseAnalysis.map((evt) => (
                  <tr key={evt.eventName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{evt.eventName}</span>
                      <span className="text-[11px] text-slate-500">{evt.institution}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {evt.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {evt.participantCount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {evt.winnerCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Trophy size={11} className="text-amber-600" />
                          {evt.winnerCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {evt.winnerCount > 0 ? (
                        <span className="text-emerald-700">{evt.winRatio}%</span>
                      ) : (
                        <span className="text-slate-400">0%</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {evt.winners.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {evt.winners.map((w, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium border border-slate-200"
                            >
                              <strong>{w.name}</strong> ({w.section.replace('III Year ', '')}) • <span className="text-amber-700 font-bold">{w.prize}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Participation Stage</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

