import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Globe,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { PageId } from '../../types/catevia';
import { canAccessPage } from '../../data/permissions';
import { useApp } from '../../context/AppContext';

export const CATEVIA_LOGO_PATH = `${import.meta.env.BASE_URL}assets/aistudio/file_00000000bb208211a824425ffb49060b_520330b0.png`;

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { role, activePage, navigate, approvals, settings, openPublicWebsite } = useApp();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [logoError, setLogoError] = useState(false);

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'Menunggu').length;

  const groups: NavGroup[] = [
    {
      id: 'main',
      label: 'Utama',
      items: [{ id: 'dashboard', label: 'Beranda', icon: LayoutDashboard }],
    },
    {
      id: 'operations',
      label: 'Operasional Katekese',
      items: [
        { id: 'participants', label: 'Peserta & Pendaftaran', icon: Users },
        { id: 'classes', label: 'Kelas & Pertemuan', icon: CalendarDays },
        { id: 'materials', label: 'Materi & Panduan', icon: BookOpen },
      ],
    },
    {
      id: 'review',
      label: 'Tinjauan & Laporan',
      items: [
        {
          id: 'approvals',
          label: 'Antrean Persetujuan',
          icon: ClipboardCheck,
          count: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        },
        { id: 'reports', label: 'Laporan & Analitik', icon: BarChart3 },
      ],
    },
    {
      id: 'admin',
      label: 'Administrasi',
      items: [
        { id: 'cms', label: 'Paroki & CMS Website', icon: Settings },
        { id: 'users', label: 'Pengguna & Peran', icon: Shield },
      ],
    },
  ];

  // Filter strictly by current user role permissions
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessPage(role, item.id)),
    }))
    .filter((group) => group.items.length > 0);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleSelect = (page: PageId) => {
    navigate(page);
    onCloseMobile();
  };

  const renderSidebarContent = (isMobileDrawer = false) => (
    <div className="flex flex-col h-full bg-white border-r border-[#E2E7EF]">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-[#E2E7EF] shrink-0">
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-2 rounded-[6px] cursor-pointer"
          aria-label="Catevia Beranda"
        >
          {!logoError ? (
            <img
              src={CATEVIA_LOGO_PATH}
              alt="Catevia — Walking the Journey of Faith"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-10 w-auto object-contain select-none"
            />
          ) : (
            <span className="text-[20px] font-bold tracking-tight text-[#082340]">
              Catevia
            </span>
          )}
        </button>

        {isMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu navigasi"
            className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[#5B687A] hover:bg-[#F2F4F8] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {visibleGroups.map((group) => {
          const isCollapsed = Boolean(collapsedGroups[group.id]);
          const isMainSingle = group.id === 'main';

          return (
            <div key={group.id}>
              {!isMainSingle && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!isCollapsed}
                  className="w-full px-2.5 pb-1.5 flex items-center justify-between text-[12px] font-medium text-[#5B687A] hover:text-[#0D1B2A] transition-colors cursor-pointer"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              )}

              {!isCollapsed && (
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      activePage === item.id ||
                      (item.id === 'cms' && activePage === 'settings');
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(item.id)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`w-full min-h-[40px] px-3 py-2 rounded-[8px] text-[14px] flex items-center justify-between gap-2 transition-colors duration-150 cursor-pointer ${
                            isActive
                              ? 'bg-[#082340] text-white font-medium'
                              : 'text-[#334155] hover:bg-[#F2F4F8] hover:text-[#082340] font-normal'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-[#E3BE7A]' : 'text-[#5B687A]'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="truncate">{item.label}</span>
                          </span>
                          {item.count !== undefined && (
                            <span
                              className={`text-[12px] font-mono-num shrink-0 ${
                                isActive ? 'text-[#E3BE7A] font-medium' : 'text-[#A65E00] font-semibold'
                              }`}
                              aria-label={`${item.count} menunggu`}
                            >
                              {item.count}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Quiet Parish Context Footer + Public Website Preview */}
      <div className="px-4 py-3.5 border-t border-[#E2E7EF] bg-[#FAFBFC] shrink-0 space-y-2.5">
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            openPublicWebsite();
          }}
          className="w-full min-h-[38px] px-3 py-1.5 rounded-[8px] border border-[#CBD4E1] bg-white hover:bg-[#F2F4F8] text-[13px] font-medium text-[#082340] flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-[#855E1E]" aria-hidden="true" />
          <span>Lihat Website Publik</span>
        </button>
        <div className="px-1">
          <p className="text-[12px] font-medium text-[#0D1B2A] truncate">{settings.parishName}</p>
          <p className="text-[11px] text-[#5B687A] truncate mt-0.5">{settings.academicYear}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 h-screen sticky top-0">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile & Tablet Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-[#082340]/40"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onCloseMobile();
          }}
        >
          <div className="w-[280px] max-w-[85vw] h-full">{renderSidebarContent(true)}</div>
        </div>
      )}
    </>
  );
};
