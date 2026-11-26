import React, { useState } from 'react';
import { Loader2, LogOut, ShieldAlert } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { canAccessPage } from './data/permissions';
import { Button } from './components/ui/Button';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoginScreen } from './components/auth/LoginScreen';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { ParticipantWizardModal } from './components/forms/ParticipantWizardModal';
import { ToastContainer } from './components/ui/ToastContainer';
import { PublicWebsitePage } from './pages/PublicWebsitePage';
import { DashboardPage } from './pages/DashboardPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { ClassesPage } from './pages/ClassesPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { ReportsPage } from './pages/ReportsPage';
import { CmsPage } from './pages/CmsPage';
import { UsersPage } from './pages/UsersPage';
import { UnauthorizedState } from './pages/UnauthorizedState';

const AppShell: React.FC = () => {
  const {
    authReady,
    authLoading,
    authError,
    currentUser,
    isAccountDeactivated,
    fatalFirestoreError,
    signInWithCredentials,
    registerWithCredentials,
    clearAuthError,
    signOut,
    isSeedingData,
    siteMode,
    openPublicWebsite,
    frontpageContent,
    role,
    activePage,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (fatalFirestoreError) {
    throw new Error(fatalFirestoreError);
  }

  // Always allow viewing the Public Frontpage Website without waiting on login
  if (siteMode === 'public') {
    return (
      <>
        <PublicWebsitePage />
        <ToastContainer />
      </>
    );
  }

  if (!authReady || isSeedingData) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#082340]" aria-hidden="true" />
        <p className="mt-3 text-[14px] font-medium text-[#0D1B2A]">
          {isSeedingData
            ? 'Menyiapkan basis data katekese paroki...'
            : 'Memeriksa sesi masuk Catevia...'}
        </p>
      </div>
    );
  }

  if (!currentUser || siteMode === 'login') {
    return (
      <>
        <LoginScreen
          onSignIn={signInWithCredentials}
          onRegister={registerWithCredentials}
          onClearError={clearAuthError}
          onBackToPublic={openPublicWebsite}
          parishLabel={frontpageContent.parishLabel}
          loading={authLoading}
          error={authError}
        />
        <ToastContainer />
      </>
    );
  }

  if (isAccountDeactivated) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-[#E2E7EF] rounded-[12px] p-7 text-center shadow-[0_8px_24px_rgba(8,35,64,0.06)]">
          <div className="w-12 h-12 rounded-[10px] bg-[#FEF2F2] text-[#B42318] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-[20px] font-bold text-[#0D1B2A]">Akun Anda Sedang Dinonaktifkan</h1>
          <p className="mt-2 text-[14px] text-[#4D5B6D] leading-relaxed">
            Akses akun <span className="font-medium text-[#0D1B2A]">{currentUser.email}</span> telah
            dinonaktifkan oleh Administrator Paroki. Silakan hubungi Sekretariat Paroki untuk
            pengaktifan kembali.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2.5">
            <Button variant="secondary" onClick={openPublicWebsite}>
              Kembali ke Halaman Depan
            </Button>
            <Button
              variant="secondary"
              icon={<LogOut className="w-4 h-4" />}
              onClick={() => void signOut()}
            >
              Keluar dari Akun
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (!canAccessPage(role, activePage)) {
      return <UnauthorizedState />;
    }

    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'participants':
        return <ParticipantsPage />;
      case 'classes':
        return <ClassesPage />;
      case 'materials':
        return <MaterialsPage />;
      case 'approvals':
        return <ApprovalsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'cms':
        return <CmsPage />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <CmsPage initialTab="parish" />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#0D1B2A] flex">
      {/* WCAG 2.2 AA Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#082340] focus:text-white focus:rounded-[8px] focus:text-[14px] focus:font-medium"
      >
        Lewati ke konten utama
      </a>

      {/* Left Sidebar (Desktop fixed + Mobile slide-over drawer) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-10 focus:outline-none"
        >
          {renderPage()}
        </main>
      </div>

      {/* Compact Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Interactive Modals & Feedback */}
      <ParticipantWizardModal />
      <GlobalSearchModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ErrorBoundary>
  );
}
