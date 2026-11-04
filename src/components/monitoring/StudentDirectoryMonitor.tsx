import React, { useState, useMemo } from 'react';
import { usePresence } from '../../context/PresenceContext';
import { getLocalStudents } from '../../services/firebase/authService';
import { Student, PresenceStatus } from '../../types';
import { StatusDot } from '../common/StatusDot';
import { Search, Filter, Radio, RefreshCw, UserCheck, UserX, AlertTriangle, User } from 'lucide-react';

interface StudentDirectoryMonitorProps {
  isAdminView?: boolean;
  onSelectStudent?: (student: Student) => void;
  onToggleSuspend?: (studentId: string, currentStatus: string) => void;
  onResetPassword?: (student: Student) => void;
}

export const StudentDirectoryMonitor: React.FC<StudentDirectoryMonitorProps> = ({
  isAdminView = false,
  onSelectStudent,
  onToggleSuspend,
  onResetPassword,
}) => {
  const { getStatus, summary, refreshPresence } = usePresence();
  const [students, setStudents] = useState<Student[]>(() => getLocalStudents());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PresenceStatus>('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');

  const reloadData = () => {
    setStudents(getLocalStudents());
    refreshPresence();
  };

  // Unique sections & years for dynamic filters
  const uniqueSections = useMemo(() => {
    const set = new Set(students.map(s => s.section).filter(Boolean));
    return Array.from(set);
  }, [students]);

  const uniqueYears = useMemo(() => {
    const set = new Set(students.map(s => s.academicYear).filter(Boolean));
    return Array.from(set);
  }, [students]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const liveStatus = getStatus(student);

      // Search matching (Name or Registration Number)
      const q = searchQuery.toUpperCase().trim();
      const matchSearch =
        !q ||
        student.fullName.toUpperCase().includes(q) ||
        student.registrationNumber.toUpperCase().includes(q);

      // Status filter
      const matchStatus = statusFilter === 'ALL' || liveStatus === statusFilter;

      // Section filter
      const matchSection = sectionFilter === 'ALL' || student.section === sectionFilter;

      // Year filter
      const matchYear = yearFilter === 'ALL' || student.academicYear === yearFilter;

      return matchSearch && matchStatus && matchSection && matchYear;
    });
  }, [students, searchQuery, statusFilter, sectionFilter, yearFilter, getStatus]);

  return (
    <div className="space-y-4">
      {/* Real-time Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-3 bg-white border rounded-2xl cursor-pointer transition-all ${
            statusFilter === 'ALL' ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-sm' : 'border-slate-200'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Students
          </span>
          <span className="text-xl font-extrabold text-slate-900">{summary.total}</span>
        </div>

        <div
          onClick={() => setStatusFilter('ONLINE')}
          className={`p-3 bg-emerald-50/60 border rounded-2xl cursor-pointer transition-all ${
            statusFilter === 'ONLINE' ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm' : 'border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <StatusDot status="ONLINE" size="sm" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Online Now
            </span>
          </div>
          <span className="text-xl font-extrabold text-emerald-900">{summary.online}</span>
        </div>

        <div
          onClick={() => setStatusFilter('OFFLINE')}
          className={`p-3 bg-slate-50 border rounded-2xl cursor-pointer transition-all ${
            statusFilter === 'OFFLINE' ? 'border-slate-600 ring-2 ring-slate-400/20 shadow-sm' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <StatusDot status="OFFLINE" size="sm" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Offline
            </span>
          </div>
          <span className="text-xl font-extrabold text-slate-700">{summary.offline}</span>
        </div>

        <div
          onClick={() => setStatusFilter('NOT_ACTIVATED')}
          className={`p-3 bg-amber-50/70 border rounded-2xl cursor-pointer transition-all ${
            statusFilter === 'NOT_ACTIVATED' ? 'border-amber-600 ring-2 ring-amber-500/20 shadow-sm' : 'border-amber-200'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <StatusDot status="NOT_ACTIVATED" size="sm" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Not Activated
            </span>
          </div>
          <span className="text-xl font-extrabold text-amber-900">{summary.notActivated}</span>
        </div>

        <div
          onClick={() => setStatusFilter('SUSPENDED')}
          className={`p-3 bg-rose-50/70 border rounded-2xl cursor-pointer transition-all col-span-2 sm:col-span-1 ${
            statusFilter === 'SUSPENDED' ? 'border-rose-600 ring-2 ring-rose-500/20 shadow-sm' : 'border-rose-200'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <StatusDot status="SUSPENDED" size="sm" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
              Suspended
            </span>
          </div>
          <span className="text-xl font-extrabold text-rose-900">{summary.suspended}</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or registration number..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          </div>

          {/* Quick Refresh & Clear */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={reloadData}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Section, Year, Status Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Filter size={14} />
            <span className="font-semibold">Filters:</span>
          </div>

          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Academic Sections</option>
            {uniqueSections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Academic Years</option>
            {uniqueYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          {(searchQuery || statusFilter !== 'ALL' || sectionFilter !== 'ALL' || yearFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setSectionFilter('ALL');
                setYearFilter('ALL');
              }}
              className="text-xs text-blue-600 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Responsive Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Live Status</th>
                <th className="py-3 px-4">Student & Reg No.</th>
                <th className="py-3 px-4">Section & Dept</th>
                <th className="py-3 px-4">Activation</th>
                <th className="py-3 px-4">Last Seen</th>
                <th className="py-3 px-4">Events</th>
                {isAdminView && <th className="py-3 px-4 text-right">Admin Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={isAdminView ? 7 : 6} className="text-center py-8 text-slate-400">
                    No matching student records found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const liveStatus = getStatus(student);
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => onSelectStudent && onSelectStudent(student)}
                    >
                      {/* Live Status indicator */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusDot status={liveStatus} showLabel size="md" />
                      </td>

                      {/* Student Name & Reg No */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {student.profilePhotoUrl ? (
                              <img
                                src={student.profilePhotoUrl}
                                alt={student.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={14} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {student.fullName}
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-blue-700">
                              {student.registrationNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Section & Department */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block">
                          {student.section}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {student.department}
                        </span>
                      </td>

                      {/* Account Activation Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {student.isActivated ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            <UserCheck size={12} /> Activated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            <AlertTriangle size={12} /> First Login Pending
                          </span>
                        )}
                      </td>

                      {/* Last Seen / Login timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {student.lastLoginAt ? (
                          new Date(student.lastLoginAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="text-slate-400 italic">Never</span>
                        )}
                      </td>

                      {/* Event Count */}
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800">
                        {student.eventCount}
                      </td>

                      {/* Admin Controls */}
                      {isAdminView && (
                        <td
                          className="py-3 px-4 whitespace-nowrap text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {onToggleSuspend && (
                              <button
                                onClick={() => onToggleSuspend(student.id, student.status)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                                  student.status === 'SUSPENDED'
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                }`}
                              >
                                {student.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                              </button>
                            )}
                            {onResetPassword && (
                              <button
                                onClick={() => onResetPassword(student)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                              >
                                Reset Pwd
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

