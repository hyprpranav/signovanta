import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PresenceProvider } from './context/PresenceContext';
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { StaffRegisterPage } from './pages/auth/StaffRegisterPage';
import { TopNavbar } from './components/navigation/TopNavbar';
import { Sidebar } from './components/navigation/Sidebar';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { NewEventForm } from './pages/student/NewEventForm';
import { StudentProfileView } from './pages/student/StudentProfileView';
import { StudentApplicationsView } from './pages/student/StudentApplicationsView';
import { StudentSettingsView } from './pages/student/StudentSettingsView';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { FirebaseSetupGuideModal } from './components/common/FirebaseSetupGuideModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { SupportIssuesView } from './components/common/SupportIssuesView';
import { EventApplication } from './types';
import { CelebrationModal } from './components/common/CelebrationModal';
import {
  getUserNotifications,
  markNotificationAsRead,
  getApplicationsForStudent,
} from './services/firebase/firestoreService';

const MainAppLayout: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'landing' | 'login' | 'staff_register'>('landing');
  const [initialRegister, setInitialRegister] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editingDraft, setEditingDraft] = useState<EventApplication | null>(null);
  const [celebration, setCelebration] = useState<{
    id: string;
    title: string;
    message: string;
    approvedByName?: string;
    isWinner?: boolean;
    actionText?: string;
    onAction?: () => void;
  } | null>(null);
  const roleForTab = currentUser?.role;
  const defaultTabForUser = roleForTab === 'MASTER_ADMIN'
    ? 'overview'
    : roleForTab && ['STAFF', 'HOD', 'AHOD'].includes(roleForTab)
    ? 'dashboard'
    : 'dashboard';

  useEffect(() => {
    setCurrentTab(defaultTabForUser);
    setIsMobileSidebarOpen(false);
  }, [currentUser?.uid, roleForTab, defaultTabForUser]);

  useEffect(() => {
    if (!currentUser) {
      setCelebration(null);
      return;
    }
    const seenKey = 'signovanta_celebrations_seen';
    const seen = new Set(JSON.parse(localStorage.getItem(seenKey) || '[]') as string[]);

    // If student, check for approved / winning events
    if (currentUser.role === 'STUDENT' && currentUser.registrationNumber) {
      const studentApps = getApplicationsForStudent(currentUser.registrationNumber);

      // Check 1: Winning achievement approved
      const winningApp = studentApps.find(
        (a) => a.prizeWon && (a.status === 'COMPLETED' || a.status === 'CERTIFICATE_SUBMITTED') && !seen.has(`win_${a.id}`)
      );
      if (winningApp) {
        setCelebration({
          id: `win_${winningApp.id}`,
          title: `Congratulations on Winning ${winningApp.prizeCategory || 'Top Honors'}!`,
          message: `Your participation and winner certificate for "${winningApp.eventName}" (${winningApp.institutionName}) have been verified and approved by the department. Outstanding achievement!`,
          approvedByName: winningApp.completedByName || winningApp.preApprovedByName || 'Faculty Coordinator',
          isWinner: true,
          actionText: 'View My Applications',
          onAction: () => setCurrentTab('applications'),
        });
        return;
      }

      // Check 2: Pre-approval milestone (50%)
      const preApprovedApp = studentApps.find(
        (a) => a.status === 'PRE_APPROVED' && !seen.has(`pre_${a.id}`)
      );
      if (preApprovedApp) {
        setCelebration({
          id: `pre_${preApprovedApp.id}`,
          title: 'Pre-Approval Granted (50% Milestone)!',
          message: `Your application for "${preApprovedApp.eventName}" has been pre-approved! You are officially authorized to participate.`,
          approvedByName: preApprovedApp.preApprovedByName || 'Faculty Coordinator',
          isWinner: false,
          actionText: 'View Applications',
          onAction: () => setCurrentTab('applications'),
        });
        return;
      }
    }

    // Check notifications for generic success
    const success = getUserNotifications(currentUser.uid).find(
      (notification) => !notification.isRead && notification.type === 'SUCCESS' && !seen.has(notification.id)
    );
    if (success) {
      setCelebration({
        id: success.id,
        title: success.title,
        message: success.message,
      });
    }
  }, [currentUser?.uid, currentUser?.registrationNumber, currentUser?.role]);

  useEffect(() => {
    const showFirstLoginCelebration = () => {
      const raw = localStorage.getItem('signovanta_first_login_celebration');
      if (!raw) return;
      const content = JSON.parse(raw) as { title: string; message: string };
      setCelebration({
        id: 'first-login',
        title: content.title || 'Account Activated Successfully!',
        message: content.message || 'Congratulations! Your official III Year ECE profile is verified. You can now submit your first event application from your dashboard.',
        actionText: 'Submit My First Event',
        onAction: () => setCurrentTab('new_event'),
      });
      localStorage.removeItem('signovanta_first_login_celebration');
    };
    window.addEventListener('signovanta:celebration-ready', showFirstLoginCelebration);
    return () => window.removeEventListener('signovanta:celebration-ready', showFirstLoginCelebration);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="relative">
          <img
            src="/signovanta-logo.png"
            alt="SIGNOVANTA"
            className="w-16 h-16 rounded-2xl object-contain bg-slate-900 p-2 border border-slate-700 shadow-2xl animate-pulse"
          />
          <div className="absolute -bottom-1 -right-1 flex gap-1">
            <img src="/mkce-logo.png" alt="MKCE" className="w-5 h-5 rounded-md bg-white p-0.5 shadow-xs" />
            <img src="/ece-logo.png" alt="ECE" className="w-5 h-5 rounded-md bg-white p-0.5 shadow-xs" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-extrabold tracking-wide text-white">
            SIGNOVANTA <span className="text-xs text-blue-400">v2.0</span>
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            ECE Department • M. Kumarasamy College of Engineering
          </p>
        </div>
      </div>
    );
  }

  // Not logged in: Show Landing Page / Login / Staff Registration
  if (!currentUser) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onGoToLogin={() => setAuthView('login')}
          onOpenRegister={() => {
            setInitialRegister(true);
            setAuthView('login');
          }}
        />
      );
    }
    if (authView === 'staff_register') {
      return (
        <>
          <StaffRegisterPage onBackToLogin={() => setAuthView('login')} />
          <FirebaseSetupGuideModal
            isOpen={showFirebaseGuide}
            onClose={() => setShowFirebaseGuide(false)}
          />
        </>
      );
    }
    return (
      <>
        <LoginPage
          onNavigateToStaffRegister={() => setAuthView('staff_register')}
          onBackToLanding={() => setAuthView('landing')}
          initialOpenRegister={initialRegister}
        />
        <FirebaseSetupGuideModal
          isOpen={showFirebaseGuide}
          onClose={() => setShowFirebaseGuide(false)}
        />
      </>
    );
  }

  const role = currentUser.role;
  const validTabs = role === 'MASTER_ADMIN'
    ? ['overview', 'students', 'staff', 'analytics', 'approvals', 'submissions', 'announcements', 'categories', 'exports', 'issues', 'settings', 'delete_things']
    : ['STAFF', 'HOD', 'AHOD'].includes(role)
    ? ['dashboard', 'submissions', 'student_requests', 'announcements', 'analytics', 'exports', 'issues', 'settings']
    : ['dashboard', 'new_event', 'applications', 'history', 'issues', 'settings'];
  const selectedTab = validTabs.includes(currentTab)
    ? currentTab
    : defaultTabForUser;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      {/* Top Navbar */}
      <TopNavbar
        portalTitle={
          role === 'MASTER_ADMIN'
            ? 'Master Console'
            : role === 'STUDENT'
            ? 'Student Dashboard'
            : 'Staff Dashboard'
        }
        onOpenFirebaseGuide={role === 'MASTER_ADMIN' ? () => setShowFirebaseGuide(true) : undefined}
        onOpenNotifications={() => setShowNotifications(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      <div className="flex-1 flex w-full">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={selectedTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area with Sticky Bottom Footer */}
        <main className="flex-1 md:ml-64 min-w-0 flex flex-col justify-between min-h-[calc(100vh-57px)] p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="flex-1 w-full">
            {currentTab === 'issues' && <SupportIssuesView />}
            {/* STUDENT DASHBOARD VIEWS */}
            {role === 'STUDENT' && selectedTab !== 'issues' && (
              <>
                {selectedTab === 'dashboard' && (
                  <StudentDashboard
                    onNewEvent={() => {
                      setEditingDraft(null);
                      setCurrentTab('new_event');
                    }}
                    onViewApplications={() => setCurrentTab('applications')}
                    onSelectApplication={() => setCurrentTab('applications')}
                    onOpenTeamFormation={() => setCurrentTab('teams')}
                    onEditDraft={(draft) => {
                      setEditingDraft(draft);
                      setCurrentTab('new_event');
                    }}
                  />
                )}
                {selectedTab === 'new_event' && (
                  <NewEventForm
                    initialData={editingDraft}
                    onBack={() => {
                      setEditingDraft(null);
                      setCurrentTab('dashboard');
                    }}
                    onSuccess={(app) => {
                      setEditingDraft(null);
                      setCurrentTab('applications');
                    }}
                  />
                )}
                {(selectedTab === 'applications' || selectedTab === 'history') && (
                  <StudentApplicationsView
                    onNewEvent={() => {
                      setEditingDraft(null);
                      setCurrentTab('new_event');
                    }}
                    onEditDraft={(draft) => {
                      setEditingDraft(draft);
                      setCurrentTab('new_event');
                    }}
                  />
                )}
                {(selectedTab === 'settings' || selectedTab === 'my_profile') && <StudentSettingsView />}
              </>
            )}

            {/* STAFF / HOD / AHOD DASHBOARD */}
            {['STAFF', 'HOD', 'AHOD'].includes(role) && selectedTab !== 'issues' && (
              <StaffDashboard activeTab={selectedTab} />
            )}

            {/* MASTER ADMIN DASHBOARD */}
            {role === 'MASTER_ADMIN' && selectedTab !== 'issues' && (
              <AdminDashboard activeTab={selectedTab} />
            )}
          </div>

          {/* Universal Dashboard Footer (HARISH PRANAV S) - Glued to bottom */}
          <footer className="mt-auto pt-8 pb-3 border-t border-slate-200/90 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
              <img src="/mkce-logo.png" alt="MKCE" className="w-5 h-5 rounded object-contain bg-white p-0.5 border border-slate-200" />
              <img src="/ece-logo.png" alt="ECE" className="w-5 h-5 rounded object-contain bg-white p-0.5 border border-slate-200" />
              <img src="/signovanta-logo.png" alt="SIGNOVANTA" className="w-5 h-5 rounded object-contain bg-slate-900 p-0.5" />
              <span className="font-bold text-slate-700">SIGNOVANTA v2.0</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">ECE Department • M. Kumarasamy College of Engineering</span>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 text-center md:text-right">
              <span className="text-[11px] font-medium text-slate-500">Crafted with Pride by</span>
              <span className="font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 text-xs">
                HARISH PRANAV S
              </span>
              <a href="tel:7845693765" className="font-bold text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                📞 7845693765
              </a>
              <span className="text-slate-300">•</span>
              <a href="mailto:harishpranavs259@gmail.com" className="font-bold text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                ✉️ harishpranavs259@gmail.com
              </a>
            </div>
          </footer>
        </main>
      </div>

      {/* Global Modals */}
      <FirebaseSetupGuideModal
        isOpen={showFirebaseGuide}
        onClose={() => setShowFirebaseGuide(false)}
      />

      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNavigate={(url) => {
          setShowNotifications(false);
          if (url.includes('applications')) setCurrentTab('applications');
        }}
      />
      {celebration && (
        <CelebrationModal
          title={celebration.title}
          message={celebration.message}
          onClose={() => {
            markNotificationAsRead(celebration.id);
            const seenKey = 'signovanta_celebrations_seen';
            const seen = JSON.parse(localStorage.getItem(seenKey) || '[]') as string[];
            localStorage.setItem(seenKey, JSON.stringify([...seen, celebration.id]));
            setCelebration(null);
          }}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <PresenceProvider>
        <MainAppLayout />
      </PresenceProvider>
    </AuthProvider>
  );
}

export default App;
