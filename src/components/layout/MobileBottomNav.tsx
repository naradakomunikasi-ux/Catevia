import React from 'react';
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { PageId } from '../../types/catevia';
import { canAccessPage } from '../../data/permissions';
import { useApp } from '../../context/AppContext';

export const MobileBottomNav: React.FC = () => {
  const { role, activePage, navigate } = useApp();

  const candidateItems: {
    id: PageId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] =
    role === 'approver'
      ? [
          { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
          { id: 'approvals', label: 'Persetujuan', icon: ClipboardCheck },
          { id: 'participants', label: 'Peserta', icon: Users },
          { id: 'classes', label: 'Kelas', icon: CalendarDays },
        ]
      : role === 'general'
        ? [
            { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
            { id: 'classes', label: 'Jadwal', icon: CalendarDays },
            { id: 'materials', label: 'Materi', icon: BookOpen },
          ]
        : [
            { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
            { id: 'participants', label: 'Peserta', icon: Users },
            { id: 'classes', label: 'Kelas', icon: CalendarDays },
            {
              id: canAccessPage(role, 'approvals') ? 'approvals' : 'materials',
              label: canAccessPage(role, 'approvals') ? 'Persetujuan' : 'Materi',
              icon: canAccessPage(role, 'approvals') ? ClipboardCheck : BookOpen,
            },
          ];

  const items = candidateItems.filter((item) => canAccessPage(role, item.id));

  return (
    <nav
      aria-label="Navigasi cepat seluler"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 h-[58px] bg-white border-t border-[#E2E7EF] flex items-center justify-around px-2"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] rounded-[8px] px-2 transition-colors cursor-pointer ${
              isActive ? 'text-[#082340] font-semibold' : 'text-[#5B687A]'
            }`}
          >
            <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
            <span className="text-[11px] mt-0.5 whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
