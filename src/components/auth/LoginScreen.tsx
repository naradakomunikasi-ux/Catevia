import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Eye, EyeOff, Lock, ShieldCheck, User, Users } from 'lucide-react';
import {
  AUTH_USERNAME_DOMAIN,
  FIREBASE_AUTH_PROVIDERS_URL,
  resolveLoginEmail,
} from '../../firebase';
import { CATEVIA_LOGO_PATH } from '../layout/Sidebar';
import { Button } from '../ui/Button';

interface LoginScreenProps {
  onSignIn: (identifier: string, password: string) => Promise<void>;
  onClearError?: () => void;
  onBackToPublic?: () => void;
  parishLabel?: string;
  loading: boolean;
  error: string | null;
}

interface NonAdminRoleAccount {
  roleLabel: string;
  personHint: string;
  username: string;
  defaultPassword: string;
}

const NON_ADMIN_DEMO_PASSWORD = '12345678';

// Non-admin role access reference (Admin account is intentionally excluded here)
const NON_ADMIN_ROLE_ACCOUNTS: NonAdminRoleAccount[] = [
  {
    roleLabel: 'Katekis / Staf Operasional',
    personHint: 'Pengelolaan peserta, kelas & kehadiran',
    username: 'katekis',
    defaultPassword: NON_ADMIN_DEMO_PASSWORD,
  },
  {
    roleLabel: 'Pastor Paroki / Penyetuju',
    personHint: 'Tinjauan & persetujuan kelayakan sakramen',
    username: 'pastor',
    defaultPassword: NON_ADMIN_DEMO_PASSWORD,
  },
  {
    roleLabel: 'Peserta / Umat',
    personHint: 'Jadwal kelas, unggah berkas & materi',
    username: 'peserta',
    defaultPassword: NON_ADMIN_DEMO_PASSWORD,
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSignIn,
  onClearError,
  onBackToPublic,
  parishLabel,
  loading,
  error,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  const activeError = localError || error;
  const isProviderDisabledError = Boolean(
    activeError && activeError.toLowerCase().includes('email/password belum diaktifkan')
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    onClearError?.();

    if (!identifier.trim()) {
      setLocalError('Masukkan username atau alamat email Anda.');
      return;
    }
    if (!password) {
      setLocalError('Masukkan kata sandi akun Anda.');
      return;
    }
    await onSignIn(identifier.trim(), password);
  };

  const handleUseRoleAccount = (account: NonAdminRoleAccount) => {
    setIdentifier(account.username);
    setPassword(account.defaultPassword);
    setLocalError(null);
    onClearError?.();
  };

  const previewResolvedEmail =
    identifier.trim() && !identifier.includes('@') ? resolveLoginEmail(identifier) : null;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center px-4 py-10">
      {onBackToPublic && (
        <div className="w-full max-w-[460px] mb-4">
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

      <div className="w-full max-w-[460px] bg-white border border-[#E2E7EF] rounded-[12px] p-7 sm:p-9 shadow-[0_8px_24px_rgba(8,35,64,0.06)]">
        <div className="flex flex-col items-center text-center">
          {!logoError ? (
            <img
              src={CATEVIA_LOGO_PATH}
              alt="Catevia — Walking the Journey of Faith"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-14 w-auto object-contain select-none"
            />
          ) : (
            <h1 className="text-[28px] font-bold tracking-tight text-[#082340]">Catevia</h1>
          )}

          <h1 className="mt-5 text-[22px] font-bold tracking-tight text-[#0D1B2A]">
            Masuk ke Portal Catevia
          </h1>
          <p className="mt-1.5 text-[14px] text-[#4D5B6D] leading-relaxed">
            Masukkan username atau email dan kata sandi Anda untuk mengakses portal katekese paroki.
          </p>
        </div>

        {activeError && (
          <div
            role="alert"
            className="mt-5 px-3.5 py-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#B42318] leading-snug space-y-2"
          >
            <p>{activeError}</p>
            {isProviderDisabledError && (
              <a
                href={FIREBASE_AUTH_PROVIDERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 text-[#991B1B]"
              >
                <span>Buka Firebase Console Sign-in Method</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4" noValidate>
          <div>
            <label
              htmlFor="auth-identifier"
              className="block text-[13px] font-medium text-[#0D1B2A] mb-1.5"
            >
              Username atau Email <span className="text-[#B42318]">*</span>
            </label>
            <div className="relative">
              <User
                className="w-4 h-4 text-[#69778A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="auth-identifier"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setLocalError(null);
                }}
                placeholder="Masukkan username atau email"
                className="w-full min-h-[42px] pl-9 pr-3 py-2 text-[14px] text-[#0D1B2A] bg-white border border-[#CBD4E1] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#082340]/20 focus:border-[#082340]"
              />
            </div>
            {previewResolvedEmail && (
              <p className="mt-1 text-[12px] text-[#5B687A]">
                ID akun sistem: <span className="font-mono text-[#082340]">{previewResolvedEmail}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-[13px] font-medium text-[#0D1B2A] mb-1.5"
            >
              Kata Sandi <span className="text-[#B42318]">*</span>
            </label>
            <div className="relative">
              <Lock
                className="w-4 h-4 text-[#69778A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLocalError(null);
                }}
                placeholder="Masukkan kata sandi"
                className="w-full min-h-[42px] pl-9 pr-11 py-2 text-[14px] text-[#0D1B2A] bg-white border border-[#CBD4E1] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#082340]/20 focus:border-[#082340]"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-[6px] text-[#5B687A] hover:text-[#082340] hover:bg-[#F2F4F8] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-1">
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Masuk ke Portal
            </Button>
          </div>
        </form>

        {/* Non-Admin Role Accounts Reference (Admin deliberately omitted) */}
        <div className="mt-6 pt-5 border-t border-[#EEF1F6]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-[13px] font-semibold text-[#0D1B2A] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#082340]" aria-hidden="true" />
              <span>Akun Akses Peran</span>
            </h2>
            <span className="text-[11px] font-mono text-[#69778A]">@{AUTH_USERNAME_DOMAIN}</span>
          </div>

          <div className="divide-y divide-[#EEF1F6] border border-[#E2E7EF] rounded-[10px] bg-[#FAFBFC] overflow-hidden">
            {NON_ADMIN_ROLE_ACCOUNTS.map((acc) => (
              <div
                key={acc.username}
                className="px-3.5 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#0D1B2A] truncate">
                    {acc.roleLabel}
                  </p>
                  <p className="text-[12px] text-[#4D5B6D] mt-0.5">
                    User: <span className="font-mono font-semibold text-[#082340]">{acc.username}</span>
                    <span className="mx-1.5 text-[#CBD4E1]">·</span>
                    Password:{' '}
                    <span className="font-mono font-semibold text-[#082340]">
                      {acc.defaultPassword}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUseRoleAccount(acc)}
                  className="shrink-0 px-2.5 min-h-[32px] rounded-[6px] border border-[#CBD4E1] bg-white text-[12px] font-medium text-[#082340] hover:bg-[#F2F5FA] transition-colors cursor-pointer"
                >
                  Isi
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#EEF1F6] flex items-start gap-2.5 text-[12px] text-[#5B687A] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#082340] shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            Pendaftaran akun pengguna baru hanya dilakukan melalui menu Administrasi oleh
            Administrator Paroki.
          </p>
        </div>
      </div>

      <p className="mt-6 text-[12px] text-[#69778A] text-center">
        Catevia · {parishLabel || 'Sistem Pembinaan Iman Terpadu'}
      </p>
    </div>
  );
};
