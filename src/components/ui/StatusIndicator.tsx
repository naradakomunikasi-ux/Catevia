import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { ApprovalStatus, ParticipantStatus } from '../../types/catevia';

type StatusValue = ParticipantStatus | ApprovalStatus | 'Aktif' | 'Nonaktif' | 'Dijadwalkan' | 'Lengkap' | 'Belum Lengkap';

interface StatusIndicatorProps {
  status: StatusValue;
  className?: string;
}

const STATUS_STYLE_MAP: Record<
  string,
  { colorClass: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  Aktif: { colorClass: 'text-[#157347]', Icon: CheckCircle2 },
  Disetujui: { colorClass: 'text-[#157347]', Icon: CheckCircle2 },
  Selesai: { colorClass: 'text-[#157347]', Icon: CheckCircle2 },
  Lengkap: { colorClass: 'text-[#157347]', Icon: CheckCircle2 },
  'Siap Sakramen': { colorClass: 'text-[#082340]', Icon: ShieldCheck },
  'Menunggu Verifikasi': { colorClass: 'text-[#A65E00]', Icon: Clock },
  Menunggu: { colorClass: 'text-[#A65E00]', Icon: Clock },
  Dijadwalkan: { colorClass: 'text-[#1D4ED8]', Icon: Clock },
  'Perlu Revisi': { colorClass: 'text-[#B42318]', Icon: AlertCircle },
  'Belum Lengkap': { colorClass: 'text-[#A65E00]', Icon: AlertCircle },
  Ditolak: { colorClass: 'text-[#B42318]', Icon: XCircle },
  Nonaktif: { colorClass: 'text-[#64748B]', Icon: XCircle },
};

/**
 * Zero-pill semantic status indicator: pairs accessible text with a clear icon
 * so status is never signaled by color alone and never uses noisy pill capsules.
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className = '' }) => {
  const config = STATUS_STYLE_MAP[status] ?? {
    colorClass: 'text-[#4D5B6D]',
    Icon: Clock,
  };
  const { Icon, colorClass } = config;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap ${colorClass} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};
