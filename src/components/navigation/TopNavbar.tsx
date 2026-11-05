import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import {
  Bell,
  LogOut,
  Flame,
  User,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { getUserNotifications } from '../../services/firebase/firestoreService';

interface TopNavbarProps {
  portalTitle: string;
  onOpenFirebaseGuide?: () => void;
  onOpenNotifications: () => void;
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  portalTitle,
  onOpenFirebaseGuide,
  onOpenNotifications,
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}) => {
  const { currentUser, studentData, staffData, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifications = currentUser ? getUserNotifications(currentUser.uid) : [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5">
      <div className="w-full flex items-center justify-between gap-3">
        {/* Left: Mobile Hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer"
            aria-label="Toggle navigation"
          >
            {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg tracking-tight shadow-xs">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                  SIGNOVANTA
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                {portalTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions, Real-time status, Role Display, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Setup Wizard Trigger */}
          {onOpenFirebaseGuide && (
            <button
              onClick={onOpenFirebaseGuide}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Firebase & Cloud Services Connection Center"
            >
              <Flame size={15} className="text-amber-600" />
              <span className="hidden sm:inline">Cloud Setup</span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Logged in User Badge & Role Display */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="md:hidden flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {currentUser.profilePhotoUrl ? (
                    <img
                      src={currentUser.profilePhotoUrl}
                      alt={currentUser.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-slate-500" />
                  )}
                </div>
                <div className="hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 leading-none">
                      {currentUser.displayName}
                    </span>
                  </div>
                  <div className="mt-1">
                    <Badge role={currentUser.role} size="sm" />
                  </div>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="pb-3 mb-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    {currentUser.department && (
                      <p className="text-[11px] font-semibold text-blue-700 mt-1">
                        {currentUser.department}
                      </p>
                    )}
                    {currentUser.designation && (
                      <p className="text-[11px] text-slate-600">{currentUser.designation}</p>
                    )}
                    <div className="mt-2">
                      <Badge role={currentUser.role} />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
