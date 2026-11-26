import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Eye, EyeOff, Lock, ShieldCheck, User, UserPlus } from 'lucide-react';
import {
  AUTH_USERNAME_DOMAIN,
  FIREBASE_AUTH_PROVIDERS_URL,
  resolveLoginEmail,
} from '../../firebase';
import { CATEVIA_LOGO_PATH } from '../layout/Sidebar';
import { Button } from '../ui/Button';

interface LoginScreenProps {
  onSignIn: (identifier: string, password: string) => Promise<void>;
  onRegister: (fullName: string, identifier: string, password: string) => Promise<void>;
  onClearError?: () => void;
  onBackToPublic?: () => void;
  parishLabel?: string;
  loading: boolean;
  error: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSignIn,
  onRegister,
  onClearError,
  onBackToPublic,
  parishLabel,
  loading,
  error,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  const activeError = localError || error;
  const isProviderDisabledError = Boolean(
    activeError && activeError.toLowerCase().includes('email/password belum diaktifkan')
  );

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setLocalError(null);
    setPassword('');
    setConfirmPassword('');
    onClearError?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    onClearError?.();

    if (mode === 'login') {
      if (!identifier.trim()) {
        setLocalError('Masukkan username atau alamat email Anda.');
        return;
      }
      if (!password) {
        setLocalError('Masukkan kata sandi akun Anda.');
        return;
      }
      await onSignIn(identifier.trim(), password);
      return;
    }

    if (fullName.trim().length < 3) {
      setLocalError('Masukkan nama lengkap minimal 3 karakter.');
      return;
    }
    if (!identifier.trim()) {
      setLocalError('Masukkan username atau alamat email untuk akun baru Anda.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Kata sandi minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    await onRegister(fullName.trim(), identifier.trim(), password);
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
            {mode === 'login' ? 'Masuk ke Portal Catevia' : 'Buat Akun Peserta Catevia'}
          </h1>
          <p className="mt-1.5 text-[14px] text-[#4D5B6D] leading-relaxed">
            {mode === 'login'
              ? 'Masukkan username atau email dan kata sandi Anda untuk mengakses portal katekese paroki.'
              : 'Daftar akun peserta baru menggunakan username/email dan kata sandi untuk memantau kelas dan berkas.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div
          role="tablist"
          aria-label="Mode autentikasi"
          className="mt-6 grid grid-cols-2 p-1 rounded-[8px] bg-[#F2F5FA] border border-[#E2E7EF]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => switchMode('login')}
            className={`min-h-[38px] text-[13px] font-semibold rounded-[6px] transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#082340] shadow-[0_1px_2px_rgba(8,35,64,0.08)]'
                : 'text-[#5B687A] hover:text-[#0D1B2A]'
            }`}
          >
            Masuk Portal
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => switchMode('register')}
            className={`min-h-[38px] text-[13px] font-semibold rounded-[6px] transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-[#082340] shadow-[0_1px_2px_rgba(8,35,64,0.08)]'
                : 'text-[#5B687A] hover:text-[#0D1B2A]'
            }`}
          >
            Daftar Akun Baru
          </button>
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

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4" noValidate>
          {mode === 'register' && (
            <div>
              <label
                htmlFor="auth-fullname"
                className="block text-[13px] font-medium text-[#0D1B2A] mb-1.5"
              >
                Nama Lengkap <span className="text-[#B42318]">*</span>
              </label>
              <div className="relative">
                <UserPlus
                  className="w-4 h-4 text-[#69778A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="auth-fullname"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setLocalError(null);
                  }}
                  placeholder="Contoh: Clara Novita Sari"
                  className="w-full min-h-[42px] pl-9 pr-3 py-2 text-[14px] text-[#0D1B2A] bg-white border border-[#CBD4E1] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#082340]/20 focus:border-[#082340]"
                />
              </div>
            </div>
          )}

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
                placeholder={
                  mode === 'login'
                    ? 'Contoh: admin, katekis, pastor, atau email'
                    : 'Contoh: clara.novita atau email Anda'
                }
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
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLocalError(null);
                }}
                placeholder={mode === 'login' ? 'Masukkan kata sandi' : 'Minimal 8 karakter'}
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

          {mode === 'register' && (
            <div>
              <label
                htmlFor="auth-confirm-password"
                className="block text-[13px] font-medium text-[#0D1B2A] mb-1.5"
              >
                Konfirmasi Kata Sandi <span className="text-[#B42318]">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-[#69778A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setLocalError(null);
                  }}
                  placeholder="Ketik ulang kata sandi"
                  className="w-full min-h-[42px] pl-9 pr-3 py-2 text-[14px] text-[#0D1B2A] bg-white border border-[#CBD4E1] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#082340]/20 focus:border-[#082340]"
                />
              </div>
            </div>
          )}

          <div className="pt-1">
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              {mode === 'login' ? 'Masuk ke Portal' : 'Buat Akun & Masuk'}
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-[#EEF1F6] flex items-start gap-2.5 text-[12px] text-[#5B687A] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#082340] shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            Pengurus paroki dapat masuk dengan username singkat (seperti{' '}
            <span className="font-mono text-[#0D1B2A]">admin</span>,{' '}
            <span className="font-mono text-[#0D1B2A]">katekis</span>,{' '}
            <span className="font-mono text-[#0D1B2A]">pastor</span> yang dipetakan ke{' '}
            <span className="font-mono text-[#0D1B2A]">@{AUTH_USERNAME_DOMAIN}</span>) atau alamat
            email terdaftar. Kata sandi diverifikasi aman di server autentikasi.
          </p>
        </div>
      </div>

      <p className="mt-6 text-[12px] text-[#69778A] text-center">
        Catevia · {parishLabel || 'Sistem Pembinaan Iman Terpadu'}
      </p>
    </div>
  );
};
