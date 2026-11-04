import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PresenceProvider } from './context/PresenceContext';
import { LoginPage } from './pages/auth/LoginPage';
import { StaffRegisterPage } from './pages/auth/StaffRegisterPage';
import { TopNavbar } from './components/navigation/TopNavbar';
import { Sidebar } from './components/navigation/Sidebar';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { NewEventForm } from './pages/student/NewEventForm';
import { StudentProfileView } from './pages/student/StudentProfileView';
import { StudentApplicationsView } from './pages/student/StudentApplicationsView';
import { TeamFormationView } from './pages/student/TeamFormationView';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { FirebaseSetupGuideModal } from './components/common/FirebaseSetupGuideModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { EventApplication } from './types';

const MainAppLayout: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'staff_register'>('login');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-2xl animate-bounce">
          S
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Loading SIGNOVANTA Portal...
        </p>
      </div>
    );
  }

  // Not logged in: Show Login / Staff Registration
  if (!currentUser) {
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
          onOpenFirebaseGuide={() => setShowFirebaseGuide(true)}
          onNavigateToStaffRegister={() => setAuthView('staff_register')}
        />
        <FirebaseSetupGuideModal
          isOpen={showFirebaseGuide}
          onClose={() => setShowFirebaseGuide(false)}
        />
      </>
    );
  }

  const role = currentUser.role;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      {/* Top Navbar */}
      <TopNavbar
        onOpenFirebaseGuide={() => setShowFirebaseGuide(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* STUDENT DASHBOARD VIEWS */}
          {role === 'STUDENT' && (
            <>
              {currentTab === 'dashboard' && (
                <StudentDashboard
                  onNewEvent={() => setCurrentTab('new_event')}
                  onViewApplications={() => setCurrentTab('applications')}
                  onSelectApplication={(app) => setCurrentTab('applications')}
                  onOpenTeamFormation={() => setCurrentTab('teams')}
                />
              )}
              {currentTab === 'new_event' && (
                <NewEventForm
                  onBack={() => setCurrentTab('dashboard')}
                  onSuccess={(app) => setCurrentTab('applications')}
                />
              )}
              {currentTab === 'my_profile' && <StudentProfileView />}
              {(currentTab === 'applications' ||
                currentTab === 'certificates' ||
                currentTab === 'history') && (
                <StudentApplicationsView onNewEvent={() => setCurrentTab('new_event')} />
              )}
              {currentTab === 'teams' && <TeamFormationView />}
              {currentTab === 'settings' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 max-w-md">
                  <h2 className="text-base font-bold text-slate-900">Portal Settings</h2>
                  <p className="text-xs text-slate-500">Manage connection and application settings</p>
                  <button
                    onClick={() => setShowFirebaseGuide(true)}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Open Firebase & Cloud Setup Guide
                  </button>
                </div>
              )}
            </>
          )}

          {/* STAFF / HOD / AHOD DASHBOARD */}
          {['STAFF', 'HOD', 'AHOD'].includes(role) && <StaffDashboard />}

          {/* MASTER ADMIN DASHBOARD */}
          {role === 'MASTER_ADMIN' && <AdminDashboard />}
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
          if (url.includes('team')) setCurrentTab('teams');
        }}
      />
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

