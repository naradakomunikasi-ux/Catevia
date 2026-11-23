import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Clock, Plus } from 'lucide-react';
import { ProgramType } from '../types/catevia';
import { hasPermission } from '../data/permissions';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SelectField, Textarea, TextInput } from '../components/ui/Input';

const FILTER_OPTIONS: ('Semua' | ProgramType)[] = [
  'Semua',
  'Katekumen (Baptis Dewasa)',
  'Komuni Pertama',
  'Krisma (Penguatan)',
];

export const MaterialsPage: React.FC = () => {
  const { currentUser, role, participants, materials, settings, toggleMaterialCompleted, addMaterial } = useApp();
  const canManage = hasPermission(role, 'manage_materials');

  const ownProgram = useMemo(() => {
    if (role !== 'general') return 'Semua' as const;
    const own = participants.find((p) => p.ownerUid === currentUser?.uid);
    return own?.program || 'Semua';
  }, [role, participants, currentUser]);

  const [programFilter, setProgramFilter] = useState<'Semua' | ProgramType>(ownProgram);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === selectedMaterialId) || null,
    [materials, selectedMaterialId]
  );

  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [program, setProgram] = useState<ProgramType | 'Semua Program'>('Katekumen (Baptis Dewasa)');
  const [sessionNumber, setSessionNumber] = useState('5');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [summary, setSummary] = useState('');
  const [pointsText, setPointsText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (programFilter === 'Semua') return materials;
    return materials.filter(
      (m) => m.program === programFilter || m.program === 'Semua Program'
    );
  }, [materials, programFilter]);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3 || summary.trim().length < 5) {
      setError('Judul materi minimal 3 karakter dan ringkasan isi minimal 5 karakter.');
      return;
    }

    const parsedSession = Math.min(100, Math.max(1, Math.round(Number(sessionNumber) || 1)));
    const parsedDuration = Math.min(300, Math.max(5, Math.round(Number(durationMinutes) || 30)));

    const keyPoints = pointsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      await addMaterial({
        title: title.trim(),
        program,
        sessionNumber: parsedSession,
        durationMinutes: parsedDuration,
        author: `Tim Katekis ${settings.parishName}`.slice(0, 120),
        summary: summary.trim(),
        keyPoints: keyPoints.length > 0 ? keyPoints : ['Refleksi iman bersama kelompok kelas.'],
      });

      setTitle('');
      setSummary('');
      setPointsText('');
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
            Materi & Panduan Pembinaan
          </h1>
          <p className="mt-1 text-[14px] text-[#4D5B6D]">
            Modul ajar katekese, panduan doa, dan bahan diskusi untuk peserta maupun katekis pendamping.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setAddOpen(true)}
          >
            Tambah Materi
          </Button>
        )}
      </div>

      {/* Program Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((opt) => {
          const active = programFilter === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setProgramFilter(opt)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-[8px] text-[13px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#082340] text-white font-medium'
                  : 'bg-white border border-[#E2E7EF] text-[#4D5B6D] hover:border-[#CBD4E1] hover:text-[#0D1B2A]'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="bg-white border border-[#E2E7EF] rounded-[10px] p-5 flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-[12px] text-[#5B687A]">
                <span>
                  {item.program} · Pertemuan {item.sessionNumber}
                </span>
                <span className="inline-flex items-center gap-1 font-mono-num shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {item.durationMinutes} mnt
                </span>
              </div>

              <h2 className="mt-2 text-[16px] font-semibold text-[#0D1B2A] leading-snug">
                {item.title}
              </h2>
              <p className="mt-1.5 text-[14px] text-[#4D5B6D] leading-relaxed">
                {item.summary}
              </p>
            </div>

            <div className="pt-3.5 border-t border-[#EEF1F6] flex flex-wrap items-center justify-between gap-3">
              <span className="text-[12px] text-[#69778A]">
                {item.author} · <span className="font-mono-num">{item.updatedAt}</span>
              </span>

              <div className="flex items-center gap-2">
                {role === 'general' && (
                  <button
                    type="button"
                    onClick={() => toggleMaterialCompleted(item.id)}
                    className={`min-h-[34px] px-3 py-1 rounded-[7px] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      item.completedByCurrentUser
                        ? 'bg-[#EDF8F1] text-[#157347]'
                        : 'bg-[#F2F4F8] text-[#334155] hover:bg-[#E7ECF3]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{item.completedByCurrentUser ? 'Sudah Dibaca' : 'Tandai Selesai'}</span>
                  </button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<BookOpen className="w-3.5 h-3.5" />}
                  onClick={() => setSelectedMaterialId(item.id)}
                >
                  Baca Ringkasan
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Material Reader Modal */}
      <Modal
        open={Boolean(selectedMaterial)}
        onClose={() => setSelectedMaterialId(null)}
        title={selectedMaterial?.title || ''}
        description={
          selectedMaterial
            ? `${selectedMaterial.program} · Disusun oleh ${selectedMaterial.author}`
            : undefined
        }
        maxWidthClass="max-w-xl"
        footer={
          selectedMaterial && (
            <>
              {role === 'general' && (
                <Button
                  variant="secondary"
                  onClick={() => void toggleMaterialCompleted(selectedMaterial.id)}
                >
                  {selectedMaterial.completedByCurrentUser
                    ? 'Batalkan Tanda Selesai'
                    : 'Tandai Sudah Dibaca'}
                </Button>
              )}
              <Button variant="primary" onClick={() => setSelectedMaterialId(null)}>
                Tutup
              </Button>
            </>
          )
        }
      >
        {selectedMaterial && (
          <div className="space-y-5">
            <p className="text-[14px] text-[#334155] leading-relaxed">{selectedMaterial.summary}</p>
            <div>
              <h3 className="text-[14px] font-semibold text-[#0D1B2A] mb-2.5">
                Pokok Bahasan Utama
              </h3>
              <ul className="space-y-2 list-disc pl-5 text-[14px] text-[#334155]">
                {selectedMaterial.keyPoints.map((pt, index) => (
                  <li key={index} className="leading-relaxed">
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Material Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah Materi Pembinaan"
        description="Publikasikan ringkasan materi baru agar dapat diakses peserta dan katekis."
        maxWidthClass="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant="primary" loading={saving} onClick={(e) => void handleAddMaterial(e)}>
              Publikasikan Materi
            </Button>
          </>
        }
      >
        <form onSubmit={(e) => void handleAddMaterial(e)} className="space-y-4">
          <TextInput
            label="Judul Materi"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError('');
            }}
            placeholder="Contoh: Pertemuan 5: Hidup Doa & Sakramen Tobat"
            error={error}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <TextInput
                label="Pertemuan Ke-"
                type="number"
                min={1}
                value={sessionNumber}
                onChange={(e) => setSessionNumber(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <SelectField
                label="Program Sasaran"
                value={program}
                onChange={(e) => setProgram(e.target.value as ProgramType | 'Semua Program')}
                options={[
                  { value: 'Katekumen (Baptis Dewasa)', label: 'Katekumen (Baptis Dewasa)' },
                  { value: 'Komuni Pertama', label: 'Komuni Pertama' },
                  { value: 'Krisma (Penguatan)', label: 'Krisma (Penguatan)' },
                  { value: 'Semua Program', label: 'Semua Program' },
                ]}
              />
            </div>
          </div>
          <TextInput
            label="Estimasi Durasi Baca / Sesi (Menit)"
            type="number"
            min={5}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
          <Textarea
            label="Ringkasan Materi"
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Jelaskan tujuan dan garis besar pembahasan pertemuan ini..."
          />
          <Textarea
            label="Pokok Bahasan (Satu poin per baris)"
            value={pointsText}
            onChange={(e) => setPointsText(e.target.value)}
            placeholder={'Makna pertobatan dalam hidup harian\nLangkah pemeriksaan batin sebelum pengakuan dosa'}
          />
        </form>
      </Modal>
    </div>
  );
};
