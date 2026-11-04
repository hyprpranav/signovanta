import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppNotification } from '../../types';
import {
  getUserNotifications,
  markNotificationAsRead,
} from '../../services/firebase/firestoreService';
import { X, Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (url: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  if (!isOpen || !currentUser) return null;

  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    getUserNotifications(currentUser.uid)
  );

  const handleMarkRead = (id: string) => {
    markNotificationAsRead(id);
    setNotifications(getUserNotifications(currentUser.uid));
  };

  const handleMarkAllRead = () => {
    notifications.forEach(n => markNotificationAsRead(n.id));
    setNotifications(getUserNotifications(currentUser.uid));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'WARNING':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'ALERT':
        return <AlertCircle size={16} className="text-rose-500" />;
      case 'INFO':
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-slate-700" />
              <h3 className="text-base font-bold text-slate-900">Notifications</h3>
              <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full font-bold">
                {notifications.filter(n => !n.isRead).length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck size={14} />
                <span>Mark All Read</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No Notifications</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You're all caught up on event updates and team invites.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    handleMarkRead(notif.id);
                    if (notif.linkUrl && onNavigate) onNavigate(notif.linkUrl);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    notif.isRead
                      ? 'bg-slate-50 border-slate-200/80 opacity-75'
                      : 'bg-white border-blue-200 shadow-xs ring-1 ring-blue-500/10'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

