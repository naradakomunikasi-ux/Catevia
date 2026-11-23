import React, { useEffect, useId } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  maxWidthClass = 'max-w-lg',
  children,
  footer,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082340]/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidthClass} bg-white rounded-[12px] border border-[#E2E7EF] shadow-[0_20px_50px_rgba(8,35,64,0.18)] flex flex-col max-h-[90vh]`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#E2E7EF]">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[18px] font-semibold text-[#0D1B2A]">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-[13px] text-[#4D5B6D]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[#5B687A] hover:bg-[#F2F4F8] hover:text-[#0D1B2A] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-[#E2E7EF] bg-[#F8F9FB] rounded-b-[12px] flex flex-wrap items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  destructive = true,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidthClass="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 ${
            destructive ? 'bg-[#FEF2F2] text-[#B42318]' : 'bg-[#EDF2F7] text-[#082340]'
          }`}
          aria-hidden="true"
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-[14px] text-[#334155] leading-relaxed">{description}</p>
      </div>
    </Modal>
  );
};

interface SlideOverDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const SlideOverDrawer: React.FC<SlideOverDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#082340]/35"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white h-full border-l border-[#E2E7EF] shadow-[0_0_40px_rgba(8,35,64,0.16)] flex flex-col">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#E2E7EF]">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[18px] font-semibold text-[#0D1B2A] truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-[13px] text-[#4D5B6D] truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel detail"
            className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[#5B687A] hover:bg-[#F2F4F8] hover:text-[#0D1B2A] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-[#E2E7EF] bg-[#F8F9FB] flex flex-wrap items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
