import React from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2.5 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="w-4 h-4 text-[#157347] shrink-0 mt-0.5" />,
          error: <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0 mt-0.5" />,
          warning: <AlertTriangle className="w-4 h-4 text-[#A65E00] shrink-0 mt-0.5" />,
          info: <Info className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />,
        };

        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto bg-white border border-[#CBD4E1] rounded-[10px] shadow-[0_10px_24px_rgba(8,35,64,0.12)] px-4 py-3 flex items-start gap-3"
          >
            {iconMap[toast.type]}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#0D1B2A] leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-[12px] text-[#4D5B6D] leading-snug">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Tutup notifikasi"
              className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#69778A] hover:bg-[#F2F4F8] hover:text-[#0D1B2A] cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
