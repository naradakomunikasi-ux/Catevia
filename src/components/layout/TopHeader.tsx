import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  UserCheck,
} from 'lucide-react';
import { PageId, UserRole } from '../../types/catevia';
import { canAccessPage, ROLE_PROFILES } from '../../data/permissions';
import { useApp } from '../../context/AppContext';

const PAGE_BREADCRUMBS: Record<PageId, { section?: string; title: string }> = {
  dashboard: { title: 'Beranda' },
  participants: { section: 'Operasional', title: 'Peserta & Pendaftaran' },
  classes: { section: 'Operasional', title: 'Kelas & Pertemuan' },
  materials: { section: 'Operasional', title: 'Materi & Panduan' },
  approvals: { section: 'Tinjauan', title: 'Antrean Persetujuan' },
  reports: { section: 'Laporan', title: 'Laporan & Analitik' },
  cms: { section: 'Administrasi', title: 'Pengaturan Paroki & CMS' },
  users: { section: 'Administrasi', title: 'Pengguna & Peran' },
  settings: { section: 'Administrasi', title: 'Pengaturan Paroki & CMS' },
};

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    currentUser,
    currentUserProfile,
    actualRole,
    role,
    isPreviewingRole,
    setRole,
    signOut,
    activePage,
    navigate,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setGlobalSearchOpen,
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const roleMeta = ROLE_PROFILES[role];
  const displayName = currentUserProfile?.name || currentUser?.displayName || roleMeta.personName;
  const displayEmail = currentUserProfile?.email || currentUser?.email || roleMeta.personEmail;
  const breadcrumb = PAGE_BREADCRUMBS[activePage];

  const roleNotifications = notifications.filter(
    (n) =>
      n.roles.includes(role) &&
      (!n.recipientUid || n.recipientUid === currentUser?.uid || role !== 'general')
  );
  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const initials = displayName
    .split(' ')
    .filter((p: string) => p && !p.endsWith('.'))
    .slice(0, 2)
    .map((p: string) => p[0])
    .join('')
    .toUpperCase() || 'CT';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E2E7EF] px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Trigger + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Buka menu navigasi"
          className="lg:hidden w-10 h-10 rounded-[8px] flex items-center justify-center text-[#334155] hover:bg-[#F2F4F8] cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[14px] min-w-0">
          {breadcrumb.section && (
            <>
              <span className="hidden sm:inline text-[#5B687A] whitespace-nowrap">
                {breadcrumb.section}
              </span>
              <span className="hidden sm:inline text-[#94A3B8]" aria-hidden="true">
                /
              </span>
            </>
          )}
          <span className="font-semibold text-[#0D1B2A] truncate">{breadcrumb.title}</span>
        </nav>
      </div>

      {/* Right: Search, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Global Search Trigger */}
        <button
          type="button"
          onClick={() => setGlobalSearchOpen(true)}
          aria-label="Buka pencarian global"
          className="min-h-[40px] px-3 rounded-[8px] border border-[#CBD4E1] bg-[#F8F9FB] hover:bg-white hover:border-[#94A3B8] text-[#4D5B6D] flex items-center gap-2.5 text-[13px] transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4 text-[#5B687A] shrink-0" aria-hidden="true" />
          <span className="hidden md:inline whitespace-nowrap">Cari peserta, kelas...</span>
          <kbd className="hidden xl:inline-block text-[11px] font-mono-num text-[#69778A] border border-[#D8DFE9] bg-white px-1.5 py-0.5 rounded-[4px]">
            Ctrl K
          </kbd>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((prev) => !prev);
              setProfileOpen(false);
            }}
            aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
            aria-expanded={notifOpen}
            className="relative min-w-[40px] min-h-[40px] px-2.5 rounded-[8px] border border-transparent hover:bg-[#F2F4F8] text-[#334155] flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Bell className="w-[18px] h-[18px]" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="text-[11px] font-mono-num font-semibold text-[#B42318]">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-2rem)] bg-white border border-[#CBD4E1] rounded-[10px] shadow-[0_14px_32px_rgba(8,35,64,0.14)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E2E7EF] flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-[#0D1B2A]">Notifikasi</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllNotificationsRead()}
                    className="text-[12px] font-medium text-[#082340] hover:underline cursor-pointer"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-[#EEF1F6]">
                {roleNotifications.length === 0 ? (
                  <p className="px-4 py-6 text-[13px] text-[#5B687A] text-center">
                    Belum ada notifikasi baru.
                  </p>
                ) : (
                  roleNotifications.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => {
                        void markNotificationRead(notif.id);
                        navigate(
                          canAccessPage(role, notif.targetPage) ? notif.targetPage : 'dashboard'
                        );
                        setNotifOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-[#F8F9FB] transition-colors cursor-pointer ${
                        !notif.read ? 'bg-[#FBF6EC]/60' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-medium text-[#0D1B2A] leading-snug">
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="text-[11px] font-medium text-[#855E1E] shrink-0">
                            Baru
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[12px] text-[#4D5B6D] leading-relaxed">
                        {notif.description}
                      </p>
                      <p className="mt-1.5 text-[11px] text-[#69778A]">{notif.timeLabel}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile, Admin Role Preview & Sign Out */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            aria-expanded={profileOpen}
            aria-label="Profil akun pengguna"
            className="min-h-[40px] pl-1.5 pr-2.5 py-1 rounded-[8px] border border-[#E2E7EF] hover:border-[#CBD4E1] hover:bg-[#F8F9FB] flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <span className="w-7 h-7 rounded-[6px] bg-[#082340] text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
              {initials}
            </span>
            <span className="hidden sm:block text-left leading-tight">
              <span className="block text-[13px] font-medium text-[#0D1B2A] whitespace-nowrap max-w-[150px] truncate">
                {displayName}
              </span>
              <span className="block text-[11px] text-[#5B687A] whitespace-nowrap">
                {isPreviewingRole ? `Pratinjau: ${roleMeta.shortLabel}` : roleMeta.shortLabel}
              </span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#5B687A] shrink-0" aria-hidden="true" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-[300px] max-w-[calc(100vw-2rem)] bg-white border border-[#CBD4E1] rounded-[10px] shadow-[0_14px_32px_rgba(8,35,64,0.14)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E2E7EF] bg-[#FAFBFC]">
                <p className="text-[14px] font-semibold text-[#0D1B2A] truncate">{displayName}</p>
                <p className="text-[12px] text-[#4D5B6D] mt-0.5">
                  {ROLE_PROFILES[actualRole].label}
                </p>
                <p className="text-[12px] text-[#69778A] truncate">{displayEmail}</p>
              </div>

              {actualRole === 'admin' && (
                <div className="p-2 border-b border-[#EEF1F6]">
                  <div className="px-2.5 py-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[#5B687A]">
                    <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Pratinjau Tampilan Peran</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {(['admin', 'operational', 'approver', 'general'] as UserRole[]).map((r) => {
                      const meta = ROLE_PROFILES[r];
                      const selected = role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setRole(r);
                            setProfileOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-[7px] flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#EDF2F7] text-[#082340] font-medium'
                              : 'hover:bg-[#F8F9FB] text-[#0D1B2A]'
                          }`}
                        >
                          <span className="text-[13px] truncate">{meta.label}</span>
                          {selected && <Check className="w-4 h-4 text-[#082340] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    void signOut();
                  }}
                  className="w-full px-2.5 py-2 rounded-[7px] text-left text-[13px] font-medium text-[#B42318] hover:bg-[#FEF2F2] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
