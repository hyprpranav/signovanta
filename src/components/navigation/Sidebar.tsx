import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  PlusCircle,
  FileText,
  Users,
  Award,
  History,
  Bell,
  Settings,
  LogOut,
  GraduationCap,
  Briefcase,
  CheckSquare,
  ShieldCheck,
  BarChart3,
  Flame,
  Radio,
  FileCheck,
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { currentUser, logout } = useAuth();
  if (!currentUser) return null;

  const role = currentUser.role;

  // Student Nav Items
  const studentNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new_event', label: 'New Event', icon: PlusCircle, highlight: true },
    { id: 'my_profile', label: 'My Profile', icon: User },
    { id: 'applications', label: 'My Applications', icon: FileText },
    { id: 'teams', label: 'Team Formation', icon: Users },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'history', label: 'Event History', icon: History },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Staff Nav Items (Shared across STAFF, HOD, AHOD)
  const staffNav = [
    { id: 'staff_dashboard', label: 'Staff Overview', icon: LayoutDashboard },
    { id: 'student_directory', label: 'Student Directory & Presence', icon: Radio, highlight: true },
    { id: 'pre_approvals', label: 'Pre-Event Approvals (50%)', icon: CheckSquare },
    { id: 'certificate_verification', label: 'Certificate Verification (100%)', icon: FileCheck },
    { id: 'team_review', label: 'Team Approvals', icon: Users },
    { id: 'reports', label: 'Department Reports', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Master Admin Nav Items
  const adminNav = [
    { id: 'admin_dashboard', label: 'Control Center', icon: LayoutDashboard },
    { id: 'student_management', label: 'Student Management', icon: GraduationCap, highlight: true },
    { id: 'staff_management', label: 'Staff & Role Requests', icon: Briefcase },
    { id: 'event_management', label: 'Event Master & Categories', icon: FileText },
    { id: 'live_monitoring', label: 'Real-Time Monitoring', icon: Radio },
    { id: 'reports_analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'audit_logs', label: 'System Audit Logs', icon: ShieldCheck },
    { id: 'settings', label: 'System Settings', icon: Settings },
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
        {/* User Identity Header Card */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {currentUser.displayName}
              </h4>
              <p className="text-[11px] font-mono text-slate-500 truncate">
                {currentUser.registrationNumber || currentUser.email}
              </p>
              <div className="mt-1">
                <Badge role={currentUser.role} size="sm" />
              </div>
            </div>
          </div>
        </div>

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
              </button>
            );
          })}
        </nav>

        {/* Bottom Signout */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

