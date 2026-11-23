import React, { useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types/catevia';
import { ROLE_PROFILES } from '../data/permissions';
import { LINGKUNGAN_OPTIONS } from '../data/seedData';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { SelectField, TextInput } from '../components/ui/Input';

export const UsersPage: React.FC = () => {
  const { currentUser, users, addUser, updateUserRole, toggleUserActive } = useApp();

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('operational');
  const [lingkungan, setLingkungan] = useState(LINGKUNGAN_OPTIONS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [confirmToggleUserId, setConfirmToggleUserId] = useState<string | null>(null);
  const targetUser = users.find((u) => u.id === confirmToggleUserId);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Masukkan nama lengkap (min. 2 karakter) dan alamat email yang valid.');
      return;
    }
    if (users.some((u) => u.email.trim().toLowerCase() === cleanEmail)) {
      setError('Alamat email tersebut sudah terdaftar di direktori pengguna Catevia.');
      return;
    }
    setSaving(true);
    try {
      await addUser({
        name: name.trim(),
        email: cleanEmail,
        role: userRole,
        lingkungan,
        active: true,
      });
      setName('');
      setEmail('');
      setUserRole('operational');
      setError('');
      setAddOpen(false);
    } finally {
      setSaving(false);
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
            Kelola akun tim katekis, Pastor Paroki, dan peserta sesuai prinsip hak akses minimal (RBAC).
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setAddOpen(true)}
        >
          Tambah Pengguna
        </Button>
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
                      <div className="text-[12px] text-[#5B687A]">{u.email}</div>
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
            placeholder="Contoh: Ignatius Budiarto"
          />
          <TextInput
            label="Alamat Email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="nama@paroki.or.id"
            error={error}
          />
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
