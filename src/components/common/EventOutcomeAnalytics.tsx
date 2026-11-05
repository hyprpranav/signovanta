import React, { useMemo } from 'react';
import { Award, BarChart3, Users } from 'lucide-react';
import { EventApplication } from '../../types';

interface EventOutcomeAnalyticsProps {
  applications: EventApplication[];
}

export const EventOutcomeAnalytics: React.FC<EventOutcomeAnalyticsProps> = ({ applications }) => {
  const metrics = useMemo(() => {
    const participated = new Set(applications.map(app => app.studentRegNo.toUpperCase().trim())).size;
    const winners = new Set(
      applications.filter(app => app.prizeWon).map(app => app.studentRegNo.toUpperCase().trim())
    ).size;
    const completed = applications.filter(app => app.status === 'COMPLETED');
    const completedWinners = new Set(
      completed.filter(app => app.prizeWon).map(app => app.studentRegNo.toUpperCase().trim())
    ).size;
    const eventRows = Array.from(new Set(applications.map(app => app.eventName).filter(Boolean))).map(eventName => {
      const eventApplications = applications.filter(app => app.eventName === eventName);
      return {
        eventName,
        participated: new Set(eventApplications.map(app => app.studentRegNo.toUpperCase().trim())).size,
        winners: new Set(eventApplications.filter(app => app.prizeWon).map(app => app.studentRegNo.toUpperCase().trim())).size,
      };
    }).sort((a, b) => b.winners - a.winners || b.participated - a.participated);
    return { participated, winners, completedWinners, eventRows };
  }, [applications]);

  const maxValue = Math.max(...metrics.eventRows.map(row => Math.max(row.participated, row.winners)), 1);
  const winnerPercent = metrics.participated ? Math.round((metrics.winners / metrics.participated) * 100) : 0;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">Event Outcome Analytics</h2>
        <p className="text-xs text-slate-500">Unique students are counted by registration number; winner totals use prize-winning submissions.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Students Participated', value: metrics.participated, color: 'text-blue-700', Icon: Users },
          { label: 'Students Won', value: metrics.winners, color: 'text-amber-700', Icon: Award },
          { label: 'Completed Winners', value: metrics.completedWinners, color: 'text-emerald-700', Icon: Award },
          { label: 'Win Rate', value: `${winnerPercent}%`, color: 'text-violet-700', Icon: BarChart3 },
        ].map(({ label, value, color, Icon }) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4">
            <Icon size={16} className={String(color)} />
            <span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
            <strong className={`mt-1 block text-2xl font-black ${color}`}>{value}</strong>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-900">Participation vs Winners</h3>
          <div className="mt-5 flex items-center gap-6">
            <div className="h-32 w-32 shrink-0 rounded-full" style={{ background: `conic-gradient(#f59e0b 0 ${winnerPercent}%, #2563eb ${winnerPercent}% 100%)` }} aria-label={`${metrics.winners} winners out of ${metrics.participated} participants`} />
            <div className="space-y-2 text-xs">
              <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />Participated: <b>{metrics.participated}</b></p>
              <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />Won: <b>{metrics.winners}</b></p>
              <p className="pt-1 text-slate-500">{winnerPercent}% of participating students won a prize.</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-900">Winners by Event</h3>
          <div className="mt-4 space-y-3">
            {metrics.eventRows.length === 0 ? <p className="text-xs text-slate-500">No event submissions yet.</p> : metrics.eventRows.map(row => (
              <div key={row.eventName}>
                <div className="mb-1 flex justify-between gap-2 text-xs font-semibold text-slate-700">
                  <span className="truncate">{row.eventName}</span><span>{row.winners} won / {row.participated} participated</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${(row.participated / maxValue) * 100}%` }} />
                  <div className="-mt-2 h-2 rounded-full bg-amber-500" style={{ width: `${(row.winners / maxValue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
