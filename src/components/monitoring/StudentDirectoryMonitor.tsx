import React, { useState, useMemo, useEffect } from 'react';
import { getLocalStudents } from '../../services/firebase/authService';
import { EventApplication, Student } from '../../types';
import { Search, Filter, RefreshCw, User, Eye } from 'lucide-react';

interface StudentDirectoryMonitorProps {
  isAdminView?: boolean;
  onSelectStudent?: (student: Student) => void;
  onToggleSuspend?: (studentId: string, currentStatus: string) => void;
  onResetPassword?: (student: Student) => void;
  onRequestDelete?: (student: Student) => void;
  applications?: EventApplication[];
}

export const StudentDirectoryMonitor: React.FC<StudentDirectoryMonitorProps> = ({
  isAdminView = false,
  onSelectStudent,
  onToggleSuspend,
  onResetPassword,
  onRequestDelete,
  applications = [],
}) => {
  const displaySection = (section: string) => section.trim().split(/\s+/).pop() || '—';
  const [students, setStudents] = useState<Student[]>(() => getLocalStudents());
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [participationFilter, setParticipationFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('ALL');

  const reloadData = () => {
    setStudents(getLocalStudents());
  };

  useEffect(() => {
    window.addEventListener('signovanta:student-updated', reloadData);
    return () => window.removeEventListener('signovanta:student-updated', reloadData);
  }, []);

  // Unique sections & years for dynamic filters
  const uniqueSections = useMemo(() => {
    const set = new Set(students.map(s => s.section).filter(Boolean));
    return Array.from(set);
  }, [students]);

  const uniqueYears = useMemo(() => {
    const set = new Set(students.map(s => s.academicYear).filter(Boolean));
    return Array.from(set);
  }, [students]);

  const uniqueCategories = useMemo(() => Array.from(new Set(applications.map(app => app.eventCategory).filter(Boolean))).sort(), [applications]);
  const uniqueEvents = useMemo(() => Array.from(new Set(applications.map(app => app.eventName).filter(Boolean))).sort(), [applications]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Search matching (Name or Registration Number)
      const q = searchQuery.toUpperCase().trim();
      const matchSearch =
        !q ||
        student.fullName.toUpperCase().includes(q) ||
        student.registrationNumber.toUpperCase().includes(q);

      // Status filter
      const matchAccount = accountFilter === 'ALL' ||
        (accountFilter === 'SUSPENDED' && student.status === 'SUSPENDED') ||
        (accountFilter === 'ACTIVE' && (student.isActivated || student.status === 'ACTIVE'));

      // Section filter
      const matchSection = sectionFilter === 'ALL' || student.section === sectionFilter;

      // Year filter
      const matchYear = yearFilter === 'ALL' || student.academicYear === yearFilter;
      const studentApplications = applications.filter(app => app.studentRegNo.toUpperCase().trim() === student.registrationNumber.toUpperCase().trim());
      const matchParticipation = participationFilter === 'ALL' ||
        (participationFilter === 'NOT_ATTEMPTED' && studentApplications.length === 0) ||
        (participationFilter === 'ATTEMPTED' && studentApplications.length > 0) ||
        (participationFilter === 'ATTENDED' && studentApplications.some(app => ['PRE_APPROVED', 'AWAITING_POST_EVENT', 'CERTIFICATE_SUBMITTED', 'FINAL_VERIFICATION', 'COMPLETED'].includes(app.status))) ||
        (participationFilter === 'COMPLETED' && studentApplications.some(app => app.status === 'COMPLETED'));
      const matchCategory = categoryFilter === 'ALL' || studentApplications.some(app => app.eventCategory === categoryFilter);
      const matchEvent = eventFilter === 'ALL' || studentApplications.some(app => app.eventName === eventFilter);

      return matchSearch && matchAccount && matchSection && matchYear && matchParticipation && matchCategory && matchEvent;
    });
  }, [students, applications, searchQuery, accountFilter, sectionFilter, yearFilter, participationFilter, categoryFilter, eventFilter]);

  return (
    <div className="space-y-4">
      {/* Account Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div
          onClick={() => setAccountFilter('ALL')}
          className={`p-3 bg-white border rounded-2xl cursor-pointer transition-all ${
            accountFilter === 'ALL' ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-sm' : 'border-slate-200'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Students
          </span>
          <span className="text-xl font-extrabold text-slate-900">{students.length}</span>
        </div>

        <div
          onClick={() => setAccountFilter('ACTIVE')}
          className={`p-3 bg-emerald-50/70 border rounded-2xl cursor-pointer transition-all ${
            accountFilter === 'ACTIVE' ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm' : 'border-emerald-200'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Login Success</span>
          <span className="text-xl font-extrabold text-emerald-900">{students.filter(student => student.isActivated || student.status === 'ACTIVE').length}</span>
        </div>

        <div
          onClick={() => setAccountFilter('SUSPENDED')}
          className={`p-3 bg-rose-50/70 border rounded-2xl cursor-pointer transition-all ${
            accountFilter === 'SUSPENDED' ? 'border-rose-600 ring-2 ring-rose-500/20 shadow-sm' : 'border-rose-200'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">Suspended Accounts</span>
          <span className="text-xl font-extrabold text-rose-900">{students.filter(student => student.status === 'SUSPENDED').length}</span>
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
                {displaySection(sec)}
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

          <select
            value={participationFilter}
            onChange={(e) => setParticipationFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Event Activity</option>
            <option value="ATTEMPTED">Attempted an Event</option>
            <option value="NOT_ATTEMPTED">Not Attempted Any Event</option>
            <option value="ATTENDED">Attended / Pre-approved</option>
            <option value="COMPLETED">Completed with Certificate</option>
          </select>

          {uniqueCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              {uniqueCategories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          )}

          {uniqueEvents.length > 0 && (
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="max-w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Events</option>
              {uniqueEvents.map(event => <option key={event} value={event}>{event}</option>)}
            </select>
          )}

          {(searchQuery || accountFilter !== 'ALL' || sectionFilter !== 'ALL' || yearFilter !== 'ALL' || participationFilter !== 'ALL' || categoryFilter !== 'ALL' || eventFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setAccountFilter('ALL');
                setSectionFilter('ALL');
                setYearFilter('ALL');
                setParticipationFilter('ALL');
                setCategoryFilter('ALL');
                setEventFilter('ALL');
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
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full table-fixed text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="w-[18%] py-2.5 px-2">Account Status</th>
                <th className="w-[34%] py-2.5 px-2">Student & Reg No.</th>
                <th className="w-[18%] py-2.5 px-2">Section</th>
                <th className="w-[15%] py-2.5 px-2">Year</th>
                <th className="w-[9%] py-2.5 px-2">Events</th>
                {isAdminView && <th className="w-[28%] py-2.5 px-2 text-right">Admin Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={isAdminView ? 6 : 5} className="text-center py-8 text-slate-400">
                    No matching student records found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => onSelectStudent && onSelectStudent(student)}
                    >
                      {/* Account Status */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${student.status === 'SUSPENDED' ? 'bg-rose-100 text-rose-700' : student.isActivated || student.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {student.status === 'SUSPENDED' ? 'Suspended' : student.isActivated || student.status === 'ACTIVE' ? 'Login Success' : 'Pending Login'}
                        </span>
                      </td>

                      {/* Student Name & Reg No */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {student.profilePhotoUrl ? (
                              <img
                                src={student.profilePhotoUrl}
                                alt={student.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={13} className="text-slate-400" />
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

                      {/* Section */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block">
                          {displaySection(student.section)}
                        </span>
                      </td>

                      {/* Academic Year */}
                      <td className="py-2.5 px-2 whitespace-nowrap text-[11px] text-slate-500">
                        {student.academicYear}
                      </td>

                      {/* Event Count */}
                      <td className="py-2.5 px-2 whitespace-nowrap font-bold text-slate-800">
                        {applications.filter(a => a.studentRegNo.toUpperCase().trim().replace(/\s+/g, '') === student.registrationNumber.toUpperCase().trim().replace(/\s+/g, '') && a.status !== 'DRAFT').length}
                      </td>

                      {/* Admin Controls */}
                      {isAdminView && (
                        <td
                          className="py-2.5 px-2 whitespace-nowrap text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {onSelectStudent && (
                              <button onClick={() => onSelectStudent(student)} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] cursor-pointer flex items-center gap-1">
                                <Eye size={12} /> View
                              </button>
                            )}
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
                            {onRequestDelete && (
                              <button onClick={() => onRequestDelete(student)} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] cursor-pointer">
                                Delete
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
        <div className="md:hidden divide-y divide-slate-100">
          {filteredStudents.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No matching student records found.
            </div>
          ) : (
            filteredStudents.map((student) => {
              return (
                <article
                  key={student.id}
                  className="p-4 space-y-3"
                  onClick={() => onSelectStudent && onSelectStudent(student)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center">
                        {student.profilePhotoUrl ? (
                          <img src={student.profilePhotoUrl} alt={student.fullName} className="h-full w-full object-cover" />
                        ) : (
                          <User size={16} className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{student.fullName}</p>
                        <p className="truncate font-mono text-[11px] font-semibold text-blue-700">{student.registrationNumber}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${student.status === 'SUSPENDED' ? 'bg-rose-100 text-rose-700' : student.isActivated || student.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {student.status === 'SUSPENDED' ? 'Suspended' : student.isActivated || student.status === 'ACTIVE' ? 'Login Success' : 'Pending Login'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Section</p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-800">{student.section ? displaySection(student.section) : '—'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Year</p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-800">{student.academicYear || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Events</p>
                      <p className="mt-1 text-xs font-semibold text-slate-800">
                        {applications.filter(a => a.studentRegNo.toUpperCase().trim().replace(/\s+/g, '') === student.registrationNumber.toUpperCase().trim().replace(/\s+/g, '') && a.status !== 'DRAFT').length}
                      </p>
                    </div>
                  </div>

                  {isAdminView && (
                    <div
                      className="flex flex-wrap gap-2 border-t border-slate-100 pt-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {onSelectStudent && (
                        <button onClick={() => onSelectStudent(student)} className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">
                          <Eye size={13} className="mr-1 inline-block" /> View
                        </button>
                      )}
                      {onToggleSuspend && (
                        <button
                          onClick={() => onToggleSuspend(student.id, student.status)}
                          className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold ${
                            student.status === 'SUSPENDED'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {student.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                        </button>
                      )}
                      {onResetPassword && (
                        <button onClick={() => onResetPassword(student)} className="w-full rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
                          Reset Password
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
