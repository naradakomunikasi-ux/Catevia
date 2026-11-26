import React, { useState } from 'react';
import { Eye, EyeOff, Plus, ShieldCheck, UserCheck } from 'lucide-react';
import { UserRole } from '../types/catevia';
import { ROLE_PROFILES } from '../data/permissions';
import { LINGKUNGAN_OPTIONS } from '../data/seedData';
import {
  formatLoginIdentifier,
  isValidLoginIdentifier,
  resolveLoginEmail,
} from '../firebase';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { SelectField, TextInput } from '../components/ui/Input';

const STANDARD_ROLE_TEMPLATES: Array<{
  username: string;
  name: string;
  role: UserRole;
  lingkungan: string;
}> = [
  {
    username: 'katekis',
    name: 'Maria Wulandari',
    role: 'operational',
    lingkungan: 'St. Lukas',
  },
  {
    username: 'pastor',
    name: 'RD. Yohanes Setiawan',
    role: 'approver',
    lingkungan: 'Pastoran Paroki',
  },
  {
    username: 'peserta',
    name: 'Clara Novita Sari',
    role: 'general',
    lingkungan: 'St. Lukas',
  },
];

export const UsersPage: React.FC = () => {
  const { currentUser, users, addUser, updateUserRole, toggleUserActive, showToast } = useApp();

  const [addOpen, setAddOpen] = useState(false);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisionPassword, setProvisionPassword] = useState('');
  const [showProvisionPassword, setShowProvisionPassword] = useState(false);
  const [provisionError, setProvisionError] = useState('');
  const [provisioning, setProvisioning] = useState(false);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('operational');
  const [lingkungan, setLingkungan] = useState(LINGKUNGAN_OPTIONS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [confirmToggleUserId, setConfirmToggleUserId] = useState<string | null>(null);
  const targetUser = users.find((u) => u.id === confirmToggleUserId);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Masukkan nama lengkap minimal 2 karakter.');
      return;
    }
    if (!isValidLoginIdentifier(identifier)) {
      setError('Masukkan username (huruf/angka, min. 3 karakter) atau alamat email yang valid.');
      return;
    }
    if (password.length < 8) {
      setError('Kata sandi akun minimal 8 karakter.');
      return;
    }
    const cleanEmail = resolveLoginEmail(identifier);
    if (users.some((u) => u.email.trim().toLowerCase() === cleanEmail)) {
      setError('Username atau email tersebut sudah terdaftar di direktori pengguna Catevia.');
      return;
    }
    setSaving(true);
    try {
      await addUser({
        name: name.trim(),
        email: cleanEmail,
        password,
        role: userRole,
        lingkungan,
        active: true,
      });
      setName('');
      setIdentifier('');
      setPassword('');
      setShowPassword(false);
      setUserRole('operational');
      setError('');
      setAddOpen(false);
    } catch {
      // Error toast already displayed by addUser
    } finally {
      setSaving(false);
    }
  };

  const missingStandardAccounts = STANDARD_ROLE_TEMPLATES.filter((tpl) => {
    const targetEmail = resolveLoginEmail(tpl.username);
    return !users.some((u) => u.email.trim().toLowerCase() === targetEmail);
  });

  const handleProvisionStandardAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (provisionPassword.length < 8) {
      setProvisionError('Masukkan kata sandi minimal 8 karakter untuk akun peran standar.');
      return;
    }
    setProvisionError('');
    setProvisioning(true);
    let createdCount = 0;
    try {
      for (const tpl of missingStandardAccounts) {
        try {
          await addUser({
            name: tpl.name,
            email: resolveLoginEmail(tpl.username),
            password: provisionPassword,
            role: tpl.role,
            lingkungan: tpl.lingkungan,
            active: true,
          });
          createdCount += 1;
        } catch {
          // Continue remaining accounts; addUser already surfaced toast
        }
      }
      if (createdCount > 0) {
        showToast({
          type: 'success',
          title: `${createdCount} akun peran standar siap digunakan`,
          description: 'Pengguna dapat langsung masuk dari halaman login menggunakan username masing-masing.',
        });
        setProvisionPassword('');
        setShowProvisionPassword(false);
        setProvisionOpen(false);
      }
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-[#0D1B2A]">
            Pengguna & Hak Akses Peran
          </h1>
          <p className="mt-1 text-[14px] text-[#4D5B6D]">
            Daftarkan akun baru untuk tim katekis, Pastor Paroki, dan peserta serta kelola hak akses (RBAC).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {missingStandardAccounts.length > 0 && (
            <Button
              variant="secondary"
              icon={<UserCheck className="w-4 h-4" />}
              onClick={() => setProvisionOpen(true)}
            >
              Siapkan Akun Peran ({missingStandardAccounts.length})
            </Button>
          )}
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setAddOpen(true)}
          >
            Daftar Akun Baru
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <section className="bg-white border border-[#E2E7EF] rounded-[10px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E7EF] bg-[#FAFBFC] text-[12px] font-medium text-[#5B687A]">
                <th className="py-3 px-5">Pengguna</th>
                <th className="py-3 px-4">Peran Sistem</th>
                <th className="py-3 px-4 hidden md:table-cell">Lingkungan / Unit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 hidden lg:table-cell">Aktivitas Terakhir</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1F6] text-[14px]">
              {users.map((u) => {
                const isSelf =
                  Boolean(currentUser) &&
                  (u.id === currentUser?.uid || u.uid === currentUser?.uid);
                return (
                  <tr key={u.id} className="hover:bg-[#F8F9FB]">
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-[#0D1B2A]">
                        {u.name}
                        {isSelf && (
                          <span className="ml-1.5 text-[12px] font-normal text-[#5B687A]">
                            (Akun Anda)
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-[#5B687A]">
                        <span className="font-mono text-[#082340]">
                          {formatLoginIdentifier(u.email)}
                        </span>
                        {formatLoginIdentifier(u.email) !== u.email && (
                          <span className="ml-1.5 text-[#7C899B]">({u.email})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Ubah peran untuk ${u.name}`}
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => void updateUserRole(u.id, e.target.value as UserRole)}
                        className="min-h-[34px] px-2.5 py-1 text-[13px] bg-white border border-[#CBD4E1] rounded-[6px] text-[#0D1B2A] cursor-pointer disabled:bg-[#F2F4F8] disabled:text-[#69778A] disabled:cursor-not-allowed"
                      >
                        {(['admin', 'operational', 'approver', 'general'] as UserRole[]).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_PROFILES[r].label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-[#4D5B6D] hidden md:table-cell">
                      {u.lingkungan}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusIndicator status={u.active ? 'Aktif' : 'Nonaktif'} />
                    </td>
                    <td className="py-3.5 px-4 text-[12px] text-[#69778A] hidden lg:table-cell">
                      {u.lastActive}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {isSelf ? (
                        <span className="text-[12px] text-[#69778A]">Terlindungi</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmToggleUserId(u.id)}
                          className={u.active ? 'text-[#B42318] hover:bg-[#FEF2F2]' : 'text-[#157347]'}
                        >
                          {u.active ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Role Responsibility Reference */}
      <section className="bg-white border border-[#E2E7EF] rounded-[10px] p-5 sm:p-6">
        <h2 className="text-[16px] font-semibold text-[#0D1B2A] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#082340]" />
          <span>Ringkasan Hak Akses Peran</span>
        </h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['admin', 'operational', 'approver', 'general'] as UserRole[]).map((r) => {
            const meta = ROLE_PROFILES[r];
            return (
              <div key={r} className="p-4 rounded-[8px] border border-[#EEF1F6] bg-[#FAFBFC]">
                <p className="text-[14px] font-semibold text-[#0D1B2A]">{meta.label}</p>
                <p className="mt-1 text-[13px] text-[#4D5B6D] leading-relaxed">
                  {meta.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add User Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah Pengguna Baru"
        description="Berikan akses sistem kepada katekis, sekretariat, atau peninjau baru."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant="primary" loading={saving} onClick={(e) => void handleAddUser(e)}>
              Simpan Pengguna
            </Button>
          </>
        }
      >
        <form onSubmit={(e) => void handleAddUser(e)} className="space-y-4">
          <TextInput
            label="Nama Lengkap"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Contoh: Maria Wulandari"
          />
          <div>
            <TextInput
              label="Username atau Email Login"
              required
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError('');
              }}
              placeholder="Contoh: katekis, pastor, peserta, atau email"
              hint={
                identifier.trim() && !identifier.includes('@')
                  ? `Akan didaftarkan sebagai ${resolveLoginEmail(identifier)}`
                  : 'Pengguna bisa masuk memakai username singkat tanpa @ atau alamat email.'
              }
            />
          </div>
          <div>
            <label
              htmlFor="new-user-password"
              className="block text-[13px] font-medium text-[#0D1B2A] mb-1.5"
            >
              Kata Sandi Akun <span className="text-[#B42318]">*</span>
            </label>
            <div className="relative">
              <input
                id="new-user-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Minimal 8 karakter"
                className="w-full min-h-[40px] pl-3 pr-11 py-2 text-[14px] text-[#0D1B2A] bg-white border border-[#CBD4E1] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#082340]/20 focus:border-[#082340]"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-[6px] text-[#5B687A] hover:text-[#082340] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="mt-1.5 text-[12px] text-[#B42318]">{error}</p>}
          </div>
          <SelectField
            label="Peran Hak Akses"
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            options={(['admin', 'operational', 'approver', 'general'] as UserRole[]).map((r) => ({
              value: r,
              label: ROLE_PROFILES[r].label,
            }))}
          />
          <SelectField
            label="Lingkungan / Unit"
            value={lingkungan}
            onChange={(e) => setLingkungan(e.target.value)}
            options={[
              { value: 'Sekretariat Paroki', label: 'Sekretariat Paroki' },
              { value: 'Pastoran Paroki', label: 'Pastoran Paroki' },
              ...LINGKUNGAN_OPTIONS.map((l) => ({ value: l, label: `Lingkungan ${l}` })),
            ]}
          />
        </form>
      </Modal>

      {/* Provision Standard Non-Admin Role Accounts Modal */}
      <Modal
        open={provisionOpen}
        onClose={() => setProvisionOpen(false)}
        title="Siapkan Akun Peran Standar"
        description="Buat sekaligus akun login Firebase & profil peran untuk akun non-admin yang belum terdaftar."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setProvisionOpen(false)}
              disabled={provisioning}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              loading={provisioning}
              onClick={(e) => void handleProvisionStandardAccounts(e)}
            >
              Buat {missingStandardAccounts.length} Akun Peran
            </Button>
          </>
        }
      >
        <form onSubmit={(e) => void handleProvisionStandardAccounts(e)} className="space-y-4">
          <div className="rounded-[8px] border border-[#E2E7EF] bg-[#FAFBFC] divide-y divide-[#EEF1F6]">
            {missingStandardAccounts.map((tpl) => (
              <div key={tpl.username} className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[13px] font-semibold text-[#0D1B2A]">
                    {ROLE_PROFILES[tpl.role].label}
                  </p>
                  <p className="text-[12px] text-[#5B687A]">{tpl.name}</p>
                </div>
                <span className="text-[12px] font-mono text-[#082340]">
                  {tpl.username}
                </span>
              </div>
            ))}
          </div>

          <div>
            <label
              htmlFor="provision-role-password"
              className="block text-[13px] font-medium text-[#0D1B2A] mb-1.5"
            >
              Kata Sandi untuk Akun Peran Non-Admin <span className="text-[#B42318]">*</span>
            </label>
            <div className="relative">
              <input
                id="provision-role-password"
                type={showProvisionPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={provisionPassword}
                onChange={(e) => {
                  setProvisionPassword(e.target.value);
                  setProvisionError('');
                }}
                placeholder="Masukkan kata sandi (minimal 8 karakter)"
                className="w-full min-h-[40px] pl-3 pr-11 py-2 text-[14px] text-[#0D1B2A] bg-white border border-[#CBD4E1] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#082340]/20 focus:border-[#082340]"
              />
              <button
                type="button"
                aria-label={showProvisionPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                onClick={() => setShowProvisionPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-[6px] text-[#5B687A] hover:text-[#082340] cursor-pointer"
              >
                {showProvisionPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {provisionError && (
              <p className="mt-1.5 text-[12px] text-[#B42318]">{provisionError}</p>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmToggleUserId)}
        onClose={() => setConfirmToggleUserId(null)}
        onConfirm={() => {
          if (confirmToggleUserId) toggleUserActive(confirmToggleUserId);
        }}
        destructive={Boolean(targetUser?.active)}
        title={targetUser?.active ? 'Nonaktifkan Akun Pengguna?' : 'Aktifkan Kembali Akun?'}
        description={
          targetUser?.active
            ? `${targetUser.name} tidak akan dapat masuk ke sistem sampai akun diaktifkan kembali.`
            : `${targetUser?.name} akan memperoleh kembali akses sesuai peran yang ditetapkan.`
        }
        confirmLabel={targetUser?.active ? 'Nonaktifkan' : 'Aktifkan'}
      />
    </div>
  );
};
