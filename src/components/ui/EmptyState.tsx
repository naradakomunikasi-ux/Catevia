import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <div className="bg-white border border-[#E2E7EF] rounded-[10px] overflow-hidden" aria-busy="true" aria-label="Memuat data">
    <div className="h-11 bg-[#F8F9FB] border-b border-[#E2E7EF] px-4 flex items-center gap-6">
      <div className="h-3.5 w-32 bg-[#E2E7EF] rounded animate-pulse" />
      <div className="h-3.5 w-28 bg-[#E2E7EF] rounded animate-pulse" />
      <div className="h-3.5 w-24 bg-[#E2E7EF] rounded animate-pulse hidden md:block" />
      <div className="h-3.5 w-20 bg-[#E2E7EF] rounded animate-pulse ml-auto" />
    </div>
    <div className="divide-y divide-[#EEF1F6]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-[52px] px-4 flex items-center gap-6">
          <div className="h-3.5 w-40 bg-[#EEF1F6] rounded animate-pulse" />
          <div className="h-3.5 w-32 bg-[#EEF1F6] rounded animate-pulse" />
          <div className="h-3.5 w-20 bg-[#EEF1F6] rounded animate-pulse hidden md:block" />
          <div className="h-3.5 w-24 bg-[#EEF1F6] rounded animate-pulse ml-auto" />
        </div>
      ))}
    </div>
  </div>
);

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => (
  <div className="bg-white border border-[#E2E7EF] rounded-[10px] px-6 py-12 text-center flex flex-col items-center">
    <div className="w-11 h-11 rounded-[10px] bg-[#F2F4F8] text-[#4D5B6D] flex items-center justify-center mb-3.5" aria-hidden="true">
      {icon || <Inbox className="w-5 h-5" />}
    </div>
    <h3 className="text-[16px] font-semibold text-[#0D1B2A]">{title}</h3>
    <p className="mt-1.5 text-[14px] text-[#4D5B6D] max-w-md leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <div className="mt-5">
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    )}
  </div>
);
