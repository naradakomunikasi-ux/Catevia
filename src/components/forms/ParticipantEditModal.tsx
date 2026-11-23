import React, { useEffect, useMemo, useState } from 'react';
import { Participant, ParticipantStatus, ProgramType } from '../../types/catevia';
import { LINGKUNGAN_OPTIONS } from '../../data/seedData';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SearchableSelect, SelectField, Textarea, TextInput } from '../ui/Input';

interface ParticipantEditModalProps {
  participant: Participant | null;
  onClose: () => void;
}

const STATUSES: ParticipantStatus[] = [
  'Aktif',
  'Menunggu Verifikasi',
  'Perlu Revisi',
  'Siap Sakramen',
  'Selesai',
];

const PROGRAMS: ProgramType[] = [
  'Katekumen (Baptis Dewasa)',
  'Komuni Pertama',
  'Krisma (Penguatan)',
];

export const ParticipantEditModal: React.FC<ParticipantEditModalProps> = ({
  participant,
  onClose,
}) => {
  const { classes, updateParticipant } = useApp();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [lingkungan, setLingkungan] = useState('');
  const [program, setProgram] = useState<ProgramType>('Katekumen (Baptis Dewasa)');
  const [classId, setClassId] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [status, setStatus] = useState<ParticipantStatus>('Aktif');
  const [documents, setDocuments] = useState({
    ktpKk: true,
    suratBaptisAtauRekomendasi: true,
    pasFoto: true,
  });
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!participant) return;
    setFullName(participant.fullName);
    setPhone(participant.phone);
    setEmail(participant.email);
    setLingkungan(participant.lingkungan);
    setProgram(participant.program);
    setClassId(participant.classId);
    setSponsorName(participant.sponsorName);
    setStatus(participant.status);
    setDocuments(participant.documents);
    setNotes(participant.notes || '');
    setErrors({});
  }, [participant]);

  const lingkunganOptions = useMemo(
    () => LINGKUNGAN_OPTIONS.map((l) => ({ value: l, label: `Lingkungan ${l}` })),
    []
  );

  const classOptions = useMemo(
    () =>
      classes
        .filter((c) => c.program === program)
        .map((c) => ({ value: c.id, label: c.name })),
    [classes, program]
  );

  // Keep classId synchronized whenever the selected program changes
  useEffect(() => {
    if (classOptions.length > 0 && !classOptions.some((o) => o.value === classId)) {
      setClassId(classOptions[0].value);
    }
  }, [classOptions, classId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant) return;

    const nextErrors: Record<string, string> = {};
    if (fullName.trim().length < 2) {
      nextErrors.fullName = 'Nama lengkap minimal 2 karakter.';
    }
    if (phone.trim().length < 6) {
      nextErrors.phone = 'Nomor telepon minimal 6 karakter.';
    }
    if (email.trim() && email.trim() !== '-' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Format alamat email tidak sesuai.';
    }
    if (sponsorName.trim().length < 2) {
      nextErrors.sponsorName = 'Nama wali minimal 2 karakter.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await updateParticipant(participant.id, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || '-',
        lingkungan,
        program,
        classId: classOptions.some((o) => o.value === classId)
          ? classId
          : classOptions[0]?.value || participant.classId,
        sponsorName: sponsorName.trim(),
        status,
        documents,
        notes: notes.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(participant)}
      onClose={onClose}
      title="Ubah Data Peserta"
      description={participant ? `${participant.code} · Terdaftar ${participant.registeredAt}` : undefined}
      maxWidthClass="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button variant="primary" loading={saving} onClick={(e) => void handleSave(e)}>
            Simpan Perubahan
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => void handleSave(e)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <TextInput
              label="Nama Lengkap"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              error={errors.fullName}
            />
          </div>

          <TextInput
            label="Nomor WhatsApp / Telepon"
            required
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
            }}
            error={errors.phone}
          />

          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            error={errors.email}
          />

          <SearchableSelect
            label="Lingkungan"
            required
            value={lingkungan}
            onChange={setLingkungan}
            options={lingkunganOptions}
          />

          <SelectField
            label="Status Peserta"
            value={status}
            onChange={(e) => setStatus(e.target.value as ParticipantStatus)}
            options={STATUSES.map((s) => ({ value: s, label: s }))}
          />

          <SelectField
            label="Program Sakramen"
            value={program}
            onChange={(e) => setProgram(e.target.value as ProgramType)}
            options={PROGRAMS.map((p) => ({ value: p, label: p }))}
          />

          <SelectField
            label="Kelas Pembinaan"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={classOptions}
          />

          <div className="sm:col-span-2">
            <TextInput
              label="Nama Wali / Orang Tua"
              required
              value={sponsorName}
              onChange={(e) => setSponsorName(e.target.value)}
              error={errors.sponsorName}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-[#E2E7EF]">
          <p className="text-[13px] font-medium text-[#0D1B2A] mb-2">Kelengkapan Berkas</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { key: 'ktpKk' as const, label: 'KTP / KK' },
              { key: 'suratBaptisAtauRekomendasi' as const, label: 'Surat Baptis / Rek.' },
              { key: 'pasFoto' as const, label: 'Pas Foto 3×4' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-[#E2E7EF] text-[13px] cursor-pointer hover:bg-[#F8F9FB]"
              >
                <input
                  type="checkbox"
                  checked={documents[item.key]}
                  onChange={(e) =>
                    setDocuments((prev) => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#082340]"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Textarea
          label="Catatan Pembinaan"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </form>
    </Modal>
  );
};
