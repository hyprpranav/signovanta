import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  PlusCircle,
  FileText,
  History,
  Bell,
  Settings,
  LogOut,
  GraduationCap,
  Briefcase,
  CheckSquare,
  BarChart3,
  Flame,
  FileCheck,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  highlight?: boolean;
  notificationCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { currentUser, studentData, staffData, logout } = useAuth();
  if (!currentUser) return null;

  const role = currentUser.role;
  const profileImage = studentData?.profilePhotoUrl || currentUser.profilePhotoUrl || staffData?.profilePhotoUrl;
  const [notificationVersion, setNotificationVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setNotificationVersion(version => version + 1);
    window.addEventListener('storage', refresh);
    window.addEventListener('signovanta:data-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('signovanta:data-updated', refresh);
    };
  }, []);

  const notifications = useMemo(() => {
    void notificationVersion;
    try {
      const applications = JSON.parse(localStorage.getItem('signovanta_applications_cache') || '[]') as Array<{ status?: string }>;
      const issues = JSON.parse(localStorage.getItem('signovanta_support_issues') || '[]') as Array<{ reply?: string }>;
      const studentRequests = JSON.parse(localStorage.getItem('signovanta_student_requests_cache') || '[]') as Array<{ status?: string }>;
      const staff = JSON.parse(localStorage.getItem('signovanta_staff_cache') || '[]') as Array<{ approvalStatus?: string }>;
      const pendingSubmissions = applications.filter(application =>
        ['SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED'].includes(application.status || '')
      ).length;
      const pendingCertificates = applications.filter(application =>
        ['CERTIFICATE_SUBMITTED', 'FINAL_VERIFICATION'].includes(application.status || '')
      ).length;
      const unresolvedIssues = issues.filter(issue => !issue.reply).length;
      const pendingRegistrations = studentRequests.filter(request => request.status === 'PENDING').length;
      const pendingStaff = staff.filter(member => member.approvalStatus === 'PENDING').length;
      const notificationItems = JSON.parse(localStorage.getItem('signovanta_notifications_cache') || '[]') as Array<{ userId?: string; isRead?: boolean }>;
      const studentNotifications = currentUser.role === 'STUDENT'
        ? notificationItems.filter(item => (item.userId === currentUser.uid || item.userId === 'ALL') && !item.isRead).length
        : 0;
      return { pendingSubmissions, pendingCertificates, unresolvedIssues, pendingRegistrations, pendingStaff, studentNotifications };
    } catch {
      return { pendingSubmissions: 0, pendingCertificates: 0, unresolvedIssues: 0, pendingRegistrations: 0, pendingStaff: 0, studentNotifications: 0 };
    }
  }, [notificationVersion]);

  // Student Nav Items
  const studentNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new_event', label: 'New Event', icon: PlusCircle, highlight: true },
    { id: 'applications', label: 'My Applications', icon: FileText, notificationCount: notifications.studentNotifications },
    { id: 'history', label: 'Event History', icon: History },
    { id: 'issues', label: 'Facing Issues?', icon: AlertCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Staff Nav Items (Shared across STAFF, HOD, AHOD - NO delete_things)
  const staffNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'submissions', label: 'Submissions', icon: FileText, notificationCount: notifications.pendingSubmissions + notifications.pendingCertificates },
    { id: 'student_requests', label: 'Student Requests', icon: GraduationCap, notificationCount: notifications.pendingRegistrations },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'exports', label: 'Exports', icon: BarChart3 },
    { id: 'issues', label: 'Facing Issues?', icon: AlertCircle, notificationCount: notifications.unresolvedIssues },
    { id: 'settings', label: 'Settings & Security', icon: Settings },
  ];

  // Master Admin Nav Items
  const adminNav: NavItem[] = [
    { id: 'overview', label: 'Control Center', icon: LayoutDashboard },
    { id: 'students', label: 'Student Management', icon: GraduationCap, highlight: true },
    { id: 'staff', label: 'Staff & Role Requests', icon: Briefcase, notificationCount: notifications.pendingStaff },
    { id: 'approvals', label: 'Registration Approvals', icon: CheckSquare, notificationCount: notifications.pendingRegistrations },
    { id: 'submissions', label: 'Submissions & Verifications', icon: FileText, notificationCount: notifications.pendingSubmissions },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'categories', label: 'Event Categories', icon: FileText },
    { id: 'exports', label: 'Exports', icon: BarChart3 },
    { id: 'issues', label: 'Requests & Issues', icon: AlertCircle, notificationCount: notifications.unresolvedIssues },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'delete_things', label: 'Delete Things', icon: Trash2 },
  ];

  const navItems =
    role === 'MASTER_ADMIN' ? adminNav : ['STAFF', 'HOD', 'AHOD'].includes(role) ? staffNav : studentNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-[57px] bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-30 transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Scrollable Nav Item Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer min-h-[44px] ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : item.highlight
                    ? 'bg-blue-50 text-blue-900 hover:bg-blue-100/70 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={17} className={isActive ? 'text-white' : item.highlight ? 'text-blue-700' : 'text-slate-500'} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.notificationCount ? (
                  <span
                    className={`min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isActive ? 'bg-rose-400 text-white' : 'bg-rose-600 text-white'
                    }`}
                    aria-label={`${item.notificationCount} new notification${item.notificationCount === 1 ? '' : 's'}`}
                  >
                    {item.notificationCount > 99 ? '99+' : item.notificationCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile and Signout */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden ring-2 ring-slate-200/80 shadow-xs">
              {profileImage ? (
                <img src={profileImage} alt={currentUser.displayName} className="w-full h-full object-cover" />
              ) : (
                currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{currentUser.displayName}</p>
              <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>

          {/* Creator Attribution in Sidebar */}
          <div className="mt-2 pt-2 border-t border-slate-100 px-1 text-center">
            <span className="text-[10px] text-slate-400 block">Crafted by <strong className="text-slate-700">HARISH PRANAV S</strong></span>
            <div className="flex items-center justify-center gap-2 text-[10px] text-blue-600 font-semibold mt-0.5">
              <a href="tel:7845693765" className="hover:underline">7845693765</a>
              <span>•</span>
              <a href="mailto:harishpranavs259@gmail.com" className="hover:underline">Email</a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
