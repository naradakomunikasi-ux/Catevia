import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { CATEVIA_LOGO_PATH } from '../layout/Sidebar';
import { Button } from '../ui/Button';

interface LoginScreenProps {
  onSignIn: () => Promise<void>;
  onBackToPublic?: () => void;
  loading: boolean;
  error: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSignIn,
  onBackToPublic,
  loading,
  error,
}) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center px-4 py-10">
      {onBackToPublic && (
        <div className="w-full max-w-[440px] mb-4">
          <button
            type="button"
            onClick={onBackToPublic}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#4D5B6D] hover:text-[#082340] transition-colors cursor-pointer min-h-[36px]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Kembali ke Halaman Depan</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-[440px] bg-white border border-[#E2E7EF] rounded-[12px] p-7 sm:p-9 shadow-[0_8px_24px_rgba(8,35,64,0.06)]">
        <div className="flex flex-col items-center text-center">
          {!logoError ? (
            <img
              src={CATEVIA_LOGO_PATH}
              alt="Catevia — Walking the Journey of Faith"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-16 w-auto object-contain select-none"
            />
          ) : (
            <h1 className="text-[28px] font-bold tracking-tight text-[#082340]">Catevia</h1>
          )}

          <h1 className="mt-6 text-[22px] font-bold tracking-tight text-[#0D1B2A]">
            Masuk ke Sistem Katekese Paroki
          </h1>
          <p className="mt-2 text-[14px] text-[#4D5B6D] leading-relaxed">
            Gunakan akun Google terverifikasi Anda untuk mengakses data katekese, jadwal kelas,
            unggah berkas, dan persetujuan sakramen.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 px-3.5 py-2.5 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#B42318] leading-snug"
          >
            {error}
          </div>
        )}

        <div className="mt-7">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={() => void onSignIn()}
          >
            Masuk dengan Akun Google
          </Button>
        </div>

        <div className="mt-6 pt-5 border-t border-[#EEF1F6] flex items-start gap-2.5 text-[12px] text-[#5B687A] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#082340] shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            Hak akses disesuaikan otomatis berdasarkan peran akun Anda (Administrator Paroki,
            Katekis, Pastor Paroki, atau Peserta) dan dilindungi oleh aturan keamanan basis data.
          </p>
        </div>
      </div>

      <p className="mt-6 text-[12px] text-[#69778A] text-center">
        Catevia · Paroki Santo Yoseph · Sistem Pembinaan Iman Terpadu
      </p>
    </div>
  );
};
