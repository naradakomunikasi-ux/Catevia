import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import {
  FaqItem,
  FrontpageContent,
  GuideStepItem,
  ProgramType,
  PublicProgram,
  PublicProgramIconType,
  PublicProgramStatus,
} from '../types/catevia';
import { syncFrontpageWithParishSettings } from '../data/cmsDefaults';
import { hasPermission } from '../data/permissions';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { SelectField, Textarea, TextInput } from '../components/ui/Input';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { ProgramArtwork } from '../components/public/PublicIcons';

export type CmsTab = 'parish' | 'programs' | 'hero' | 'pages' | 'contact';

interface CmsPageProps {
  initialTab?: CmsTab;
}

interface ProgramFormState {
  name: string;
  iconType: PublicProgramIconType;
  audience: string;
  mode: string;
  scheduleSummary: string;
  status: PublicProgramStatus;
  summary: string;
  overview: string;
  learnItemsText: string;
  requirementsText: string;
  documentsText: string;
  policyNote: string;
  linkedProgram: ProgramType | '';
  published: boolean;
  displayOrder: number;
}

const ICON_OPTIONS: { value: PublicProgramIconType; label: string }[] = [
  { value: 'baptis', label: 'Air & Gelombang (Baptis / Katekumen)' },
  { value: 'ekaristi', label: 'Piala & Hosti (Komuni Pertama)' },
  { value: 'krisma', label: 'Merpati & Roh Kudus (Krisma)' },
  { value: 'persink', label: 'Kitab Terbuka & Salib (Persink)' },
  { value: 'umum', label: 'Salib Pastoral (Program Umum)' },
];

const STATUS_OPTIONS: { value: PublicProgramStatus; label: string }[] = [
  { value: 'Pendaftaran Dibuka', label: 'Pendaftaran Dibuka' },
  { value: 'Akan Dibuka', label: 'Akan Dibuka' },
  { value: 'Ditutup', label: 'Ditutup' },
];

const LINKED_PROGRAM_OPTIONS: { value: ProgramType | ''; label: string }[] = [
  { value: '', label: 'Tidak ditautkan ke program portal khusus' },
  { value: 'Katekumen (Baptis Dewasa)', label: 'Katekumen (Baptis Dewasa)' },
  { value: 'Komuni Pertama', label: 'Komuni Pertama' },
  { value: 'Krisma (Penguatan)', label: 'Krisma (Penguatan)' },
];

function createEmptyProgramForm(nextOrder: number): ProgramFormState {
  return {
    name: '',
    iconType: 'baptis',
    audience: '',
    mode: 'Tatap muka',
    scheduleSummary: '',
    status: 'Pendaftaran Dibuka',
    summary: '',
    overview: '',
    learnItemsText: '',
    requirementsText: '',
    documentsText: '',
    policyNote: '',
    linkedProgram: '',
    published: true,
    displayOrder: nextOrder,
  };
}

function linesToArray(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export const CmsPage: React.FC<CmsPageProps> = ({ initialTab }) => {
  const {
    role,
    settings,
    updateSettings,
    frontpageContent,
    publicPrograms,
    updateFrontpageContent,
    createPublicProgram,
    updatePublicProgram,
    deletePublicProgram,
    togglePublicProgramPublished,
    reorderPublicProgram,
    openPublicWebsite,
    showToast,
  } = useApp();

  const canEditParishSettings = hasPermission(role, 'manage_settings');
  const [activeTab, setActiveTab] = useState<CmsTab>(
    initialTab ?? (canEditParishSettings ? 'parish' : 'programs')
  );

  // Unified Parish Settings state (single source of truth for identity & official contact)
  const [parishForm, setParishForm] = useState(settings);
  const [parishErrors, setParishErrors] = useState<Record<string, string>>({});
  const [savingParish, setSavingParish] = useState(false);

  // Public Frontpage CMS content state
  const [contentForm, setContentForm] = useState<FrontpageContent>(frontpageContent);
  const [aboutHighlightsText, setAboutHighlightsText] = useState(
    frontpageContent.aboutHighlights.join('\n')
  );
  const [savingContent, setSavingContent] = useState(false);

  // Program Modal state
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programForm, setProgramForm] = useState<ProgramFormState>(createEmptyProgramForm(1));
  const [programErrors, setProgramErrors] = useState<Record<string, string>>({});
  const [savingProgram, setSavingProgram] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState<PublicProgram | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    setParishForm(settings);
  }, [settings]);

  useEffect(() => {
    setContentForm(frontpageContent);
    setAboutHighlightsText(frontpageContent.aboutHighlights.join('\n'));
  }, [frontpageContent]);

  const sortedPrograms = [...publicPrograms].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
  );
  const publishedCount = sortedPrograms.filter((p) => p.published).length;

  const handleSaveParishSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditParishSettings) return;

    const nextErrors: Record<string, string> = {};
    if (parishForm.parishName.trim().length < 2) {
      nextErrors.parishName = 'Nama paroki minimal 2 karakter.';
    }
    if (parishForm.diocese.trim().length < 2) {
      nextErrors.diocese = 'Nama keuskupan minimal 2 karakter.';
    }
    if (parishForm.academicYear.trim().length < 3) {
      nextErrors.academicYear = 'Periode tahun ajaran minimal 3 karakter.';
    }
    const minAttend = Math.round(Number(parishForm.minimumAttendancePercent));
    if (Number.isNaN(minAttend) || minAttend < 50 || minAttend > 100) {
      nextErrors.minimumAttendancePercent = 'Masukkan persentase bulat antara 50% hingga 100%.';
    }
    if (parishForm.pastorName.trim().length < 2) {
      nextErrors.pastorName = 'Nama Pastor Paroki minimal 2 karakter.';
    }
    if (parishForm.coordinatorName.trim().length < 2) {
      nextErrors.coordinatorName = 'Nama Koordinator minimal 2 karakter.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parishForm.contactEmail.trim())) {
      nextErrors.contactEmail = 'Masukkan alamat email kontak yang valid.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setParishErrors(nextErrors);
      return;
    }

    const sanitizedSettings = {
      ...parishForm,
      parishName: parishForm.parishName.trim().slice(0, 120),
      diocese: parishForm.diocese.trim().slice(0, 120),
      academicYear: parishForm.academicYear.trim().slice(0, 80),
      minimumAttendancePercent: minAttend,
      pastorName: parishForm.pastorName.trim().slice(0, 120),
      coordinatorName: parishForm.coordinatorName.trim().slice(0, 120),
      contactEmail: parishForm.contactEmail.trim().slice(0, 160),
      contactPhone: parishForm.contactPhone.trim().slice(0, 40),
    };

    setSavingParish(true);
    try {
      await updateSettings(sanitizedSettings, { silent: true });
      const syncedFrontpage = syncFrontpageWithParishSettings(
        frontpageContent,
        sanitizedSettings,
        settings.parishName
      );
      await updateFrontpageContent(syncedFrontpage, { silent: true });
      showToast({
        type: 'success',
        title: 'Pengaturan paroki & website disimpan',
        description:
          'Identitas paroki, kontak resmi, dan konten halaman depan telah diselaraskan otomatis.',
      });
    } finally {
      setSavingParish(false);
    }
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (contentForm.heroTitle.trim().length < 4) {
      showToast({ type: 'error', title: 'Judul utama hero minimal 4 karakter.' });
      return;
    }
    if (contentForm.heroSubtitle.trim().length < 10) {
      showToast({ type: 'error', title: 'Deskripsi hero minimal 10 karakter.' });
      return;
    }
    if (contentForm.aboutContent.trim().length < 10) {
      showToast({ type: 'error', title: 'Narasi halaman Tentang minimal 10 karakter.' });
      return;
    }

    setSavingContent(true);
    try {
      const mergedContent = syncFrontpageWithParishSettings(
        {
          ...contentForm,
          aboutHighlights: linesToArray(aboutHighlightsText),
        },
        settings
      );
      await updateFrontpageContent(mergedContent);
    } finally {
      setSavingContent(false);
    }
  };

  const openAddProgramModal = () => {
    setEditingProgramId(null);
    setProgramForm(createEmptyProgramForm(sortedPrograms.length + 1));
    setProgramErrors({});
    setProgramModalOpen(true);
  };

  const openEditProgramModal = (program: PublicProgram) => {
    setEditingProgramId(program.id);
    setProgramForm({
      name: program.name,
      iconType: program.iconType,
      audience: program.audience,
      mode: program.mode,
      scheduleSummary: program.scheduleSummary,
      status: program.status,
      summary: program.summary,
      overview: program.overview,
      learnItemsText: program.learnItems.join('\n'),
      requirementsText: program.requirements.join('\n'),
      documentsText: program.documents.join('\n'),
      policyNote: program.policyNote,
      linkedProgram: program.linkedProgram,
      published: program.published,
      displayOrder: program.displayOrder,
    });
    setProgramErrors({});
    setProgramModalOpen(true);
  };

  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const normalizedName = programForm.name.trim().toLowerCase();
    if (normalizedName.length < 2) {
      errs.name = 'Nama program minimal 2 karakter.';
    } else if (
      publicPrograms.some(
        (p) => p.id !== editingProgramId && p.name.trim().toLowerCase() === normalizedName
      )
    ) {
      errs.name = 'Nama program ini sudah ada di daftar. Gunakan nama lain atau edit program yang ada.';
    }
    if (programForm.audience.trim().length < 2) errs.audience = 'Sasaran peserta wajib diisi.';
    if (programForm.mode.trim().length < 2) errs.mode = 'Bentuk kelas wajib diisi.';
    if (programForm.summary.trim().length < 5)
      errs.summary = 'Ringkasan kartu minimal 5 karakter.';
    if (programForm.overview.trim().length < 10)
      errs.overview = 'Penjelasan lengkap minimal 10 karakter.';

    setProgramErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload: Omit<PublicProgram, 'id' | 'updatedAt'> = {
      name: programForm.name.trim(),
      iconType: programForm.iconType,
      audience: programForm.audience.trim(),
      mode: programForm.mode.trim(),
      scheduleSummary: programForm.scheduleSummary.trim(),
      status: programForm.status,
      summary: programForm.summary.trim(),
      overview: programForm.overview.trim(),
      learnItems: linesToArray(programForm.learnItemsText),
      requirements: linesToArray(programForm.requirementsText),
      documents: linesToArray(programForm.documentsText),
      policyNote: programForm.policyNote.trim(),
      linkedProgram: programForm.linkedProgram,
      published: programForm.published,
      displayOrder: Number.isFinite(programForm.displayOrder)
        ? Math.max(0, Math.min(500, Math.round(programForm.displayOrder)))
        : sortedPrograms.length + 1,
    };

    setSavingProgram(true);
    try {
      if (editingProgramId) {
        await updatePublicProgram(editingProgramId, payload);
      } else {
        await createPublicProgram(payload);
      }
      setProgramModalOpen(false);
    } finally {
      setSavingProgram(false);
    }
  };

  const updateGuideStep = (index: number, patch: Partial<GuideStepItem>) => {
    setContentForm((prev) => ({
      ...prev,
      guideSteps: prev.guideSteps.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    }));
  };

  const addGuideStep = () => {
    if (contentForm.guideSteps.length >= 10) return;
    setContentForm((prev) => ({
      ...prev,
      guideSteps: [...prev.guideSteps, { title: '', description: '' }],
    }));
  };

  const removeGuideStep = (index: number) => {
    setContentForm((prev) => ({
      ...prev,
      guideSteps: prev.guideSteps.filter((_, i) => i !== index),
    }));
  };

  const updateFaq = (index: number, patch: Partial<FaqItem>) => {
    setContentForm((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => (i === index ? { ...faq, ...patch } : faq)),
    }));
  };

  const addFaq = () => {
    if (contentForm.faqs.length >= 20) return;
    setContentForm((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }],
    }));
  };

  const removeFaq = (index: number) => {
    setContentForm((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] sm:text-[26px] font-bold tracking-tight text-[#0D1B2A]">
            Pengaturan Paroki & CMS Website
          </h1>
          <p className="mt-1 text-[14px] text-[#4D5B6D]">
            Satu dasbor terpadu untuk mengelola identitas paroki, aturan kelayakan sakramen, katalog
            program publik, dan konten halaman depan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            icon={<Globe className="w-4 h-4" />}
            onClick={openPublicWebsite}
          >
            Pratinjau Website
          </Button>
          {activeTab === 'programs' && (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={openAddProgramModal}
            >
              Tambah Program
            </Button>
          )}
        </div>
      </div>

      {/* Unified Summary Strip */}
      <div className="bg-white border border-[#E2E7EF] rounded-[12px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EEF1F6]">
        <div className="px-5 py-4 min-w-0">
          <p className="text-[12px] font-medium text-[#5B687A]">Paroki & Periode Aktif</p>
          <p className="mt-1 text-[15px] font-semibold text-[#0D1B2A] truncate">
            {settings.parishName}
          </p>
          <p className="mt-0.5 text-[12px] text-[#4D5B6D] truncate">{settings.academicYear}</p>
        </div>
        <div className="px-5 py-4 min-w-0">
          <p className="text-[12px] font-medium text-[#5B687A]">Syarat Kehadiran Min.</p>
          <p className="mt-1 text-[15px] font-semibold font-mono-num text-[#082340]">
            {settings.minimumAttendancePercent}%
          </p>
          <p className="mt-0.5 text-[12px] text-[#4D5B6D] truncate">{settings.pastorName}</p>
        </div>
        <div className="px-5 py-4 min-w-0">
          <p className="text-[12px] font-medium text-[#5B687A]">Program Tampil Publik</p>
          <p className="mt-1 text-[15px] font-semibold font-mono-num text-[#157347]">
            {publishedCount} / {sortedPrograms.length} program
          </p>
          <p className="mt-0.5 text-[12px] text-[#4D5B6D]">
            {sortedPrograms.length - publishedCount} draf tersembunyi
          </p>
        </div>
        <div className="px-5 py-4 min-w-0">
          <p className="text-[12px] font-medium text-[#5B687A]">Panduan & FAQ Publik</p>
          <p className="mt-1 text-[15px] font-semibold font-mono-num text-[#0D1B2A]">
            {frontpageContent.guideSteps.length} langkah · {frontpageContent.faqs.length} FAQ
          </p>
          <p className="mt-0.5 text-[12px] text-[#4D5B6D]">
            {frontpageContent.showScriptureSection ? 'Ayat Kitab Suci aktif' : 'Ayat disembunyikan'}
          </p>
        </div>
      </div>

      {/* Unified Segmented Tabs */}
      <div
        className="inline-flex items-center gap-1 p-1 bg-[#EDF1F6] rounded-[10px] overflow-x-auto max-w-full"
        role="tablist"
        aria-label="Bagian Pengaturan Paroki dan CMS Website"
      >
        {(
          [
            { id: 'parish', label: 'Identitas & Aturan Paroki' },
            { id: 'programs', label: `Program Frontpage (${publishedCount}/${sortedPrograms.length})` },
            { id: 'hero', label: 'Hero & Beranda' },
            { id: 'pages', label: 'Tentang, Panduan & FAQ' },
            { id: 'contact', label: 'Kontak & Footer' },
          ] as { id: CmsTab; label: string }[]
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 min-h-[38px] rounded-[8px] text-[13px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-white text-[#082340] font-semibold shadow-xs'
                  : 'text-[#4D5B6D] hover:text-[#0D1B2A] font-medium'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ======================== TAB 0: PARISH IDENTITY & RULES ======================== */}
      {activeTab === 'parish' && (
        <form
          onSubmit={(e) => void handleSaveParishSettings(e)}
          noValidate
          className="bg-white border border-[#E2E7EF] rounded-[12px] divide-y divide-[#EEF1F6] max-w-4xl"
        >
          {!canEditParishSettings && (
            <div className="px-6 py-4 bg-[#F8F9FB] flex items-start gap-3">
              <Lock className="w-4 h-4 text-[#5B687A] mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-[13px] text-[#4D5B6D] leading-relaxed">
                Anda melihat konfigurasi paroki dalam mode baca saja. Perubahan identitas paroki,
                tahun ajaran, dan syarat kelayakan sakramen hanya dapat dilakukan oleh{' '}
                <strong className="text-[#0D1B2A]">Administrator Paroki</strong>. Anda tetap dapat
                mengelola seluruh tab konten & program website publik.
              </p>
            </div>
          )}

          {/* Group 1: Parish Identity */}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-[17px] font-semibold text-[#0D1B2A]">
                Identitas Paroki & Periode Aktif
              </h2>
              <p className="text-[13px] text-[#5B687A] mt-0.5">
                Digunakan pada laporan rekapitulasi, surat keterangan PDF, portal internal, dan
                label website publik.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Nama Paroki"
                required
                disabled={!canEditParishSettings}
                value={parishForm.parishName}
                onChange={(e) => {
                  setParishForm({ ...parishForm, parishName: e.target.value });
                  setParishErrors((p) => ({ ...p, parishName: '' }));
                }}
                error={parishErrors.parishName}
                maxLength={120}
              />
              <TextInput
                label="Keuskupan"
                required
                disabled={!canEditParishSettings}
                value={parishForm.diocese}
                onChange={(e) => {
                  setParishForm({ ...parishForm, diocese: e.target.value });
                  setParishErrors((p) => ({ ...p, diocese: '' }));
                }}
                error={parishErrors.diocese}
                maxLength={120}
              />
              <TextInput
                label="Tahun Ajaran / Gelombang Aktif"
                required
                disabled={!canEditParishSettings}
                value={parishForm.academicYear}
                onChange={(e) => {
                  setParishForm({ ...parishForm, academicYear: e.target.value });
                  setParishErrors((p) => ({ ...p, academicYear: '' }));
                }}
                error={parishErrors.academicYear}
                maxLength={80}
              />
              <TextInput
                label="Syarat Kehadiran Minimum (%)"
                type="number"
                min={50}
                max={100}
                step={1}
                required
                disabled={!canEditParishSettings}
                value={String(parishForm.minimumAttendancePercent)}
                onChange={(e) => {
                  setParishForm({
                    ...parishForm,
                    minimumAttendancePercent: Number(e.target.value),
                  });
                  setParishErrors((p) => ({ ...p, minimumAttendancePercent: '' }));
                }}
                error={parishErrors.minimumAttendancePercent}
              />
            </div>
          </div>

          {/* Group 2: Leadership & Official Contact */}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-[17px] font-semibold text-[#0D1B2A]">
                Penanggung Jawab & Kontak Resmi
              </h2>
              <p className="text-[13px] text-[#5B687A] mt-0.5">
                Tampil pada surat keterangan sakramen dan kontak resmi sekretariat katekese.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Pastor Kepala Paroki"
                required
                disabled={!canEditParishSettings}
                value={parishForm.pastorName}
                onChange={(e) => {
                  setParishForm({ ...parishForm, pastorName: e.target.value });
                  setParishErrors((p) => ({ ...p, pastorName: '' }));
                }}
                error={parishErrors.pastorName}
                maxLength={120}
              />
              <TextInput
                label="Koordinator Seksi Katekese"
                required
                disabled={!canEditParishSettings}
                value={parishForm.coordinatorName}
                onChange={(e) => {
                  setParishForm({ ...parishForm, coordinatorName: e.target.value });
                  setParishErrors((p) => ({ ...p, coordinatorName: '' }));
                }}
                error={parishErrors.coordinatorName}
                maxLength={120}
              />
              <TextInput
                label="Email Sekretariat Katekese"
                type="email"
                required
                disabled={!canEditParishSettings}
                value={parishForm.contactEmail}
                onChange={(e) => {
                  setParishForm({ ...parishForm, contactEmail: e.target.value });
                  setParishErrors((p) => ({ ...p, contactEmail: '' }));
                }}
                error={parishErrors.contactEmail}
                maxLength={160}
              />
              <TextInput
                label="Telepon Sekretariat"
                disabled={!canEditParishSettings}
                value={parishForm.contactPhone}
                onChange={(e) =>
                  setParishForm({ ...parishForm, contactPhone: e.target.value })
                }
                maxLength={40}
              />
            </div>
          </div>

          {/* Group 3: Workflow Rules */}
          <div className="p-6 space-y-3">
            <h2 className="text-[17px] font-semibold text-[#0D1B2A]">
              Aturan Alur Kerja Pembinaan
            </h2>
            <label className="flex items-start gap-3 py-1.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEditParishSettings}
                checked={parishForm.autoNotifyLingkungan}
                onChange={(e) =>
                  setParishForm({ ...parishForm, autoNotifyLingkungan: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 accent-[#082340]"
              />
              <span>
                <span className="block text-[14px] font-medium text-[#0D1B2A]">
                  Kirim pengingat berkas ke Ketua Lingkungan
                </span>
                <span className="block text-[12px] text-[#5B687A]">
                  Membantu verifikasi surat rekomendasi umat secara lebih cepat.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 py-1.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEditParishSettings}
                checked={parishForm.requireSponsorVerification}
                onChange={(e) =>
                  setParishForm({
                    ...parishForm,
                    requireSponsorVerification: e.target.checked,
                  })
                }
                className="mt-0.5 w-4 h-4 accent-[#082340]"
              />
              <span>
                <span className="block text-[14px] font-medium text-[#0D1B2A]">
                  Wajibkan verifikasi data Wali Baptis / Krisma
                </span>
                <span className="block text-[12px] text-[#5B687A]">
                  Menampilkan pengingat pemeriksaan status wali sebelum persetujuan akhir Pastor.
                </span>
              </span>
            </label>
          </div>

          {/* Footer Action — Automatic Public Website Sync */}
          {canEditParishSettings && (
            <div className="px-6 py-4 bg-[#FAFBFC] rounded-b-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[12px] text-[#5B687A]">
                Nama Paroki, Email, dan Telepon otomatis digunakan sebagai sumber tunggal di seluruh
                portal, PDF, dan Website Publik.
              </p>

              <div className="flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={savingParish}
                  onClick={() => {
                    setParishForm(settings);
                    setParishErrors({});
                  }}
                >
                  Batalkan
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={savingParish}
                  icon={<Save className="w-4 h-4" />}
                >
                  Simpan Pengaturan Paroki
                </Button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* ======================== TAB 1: PUBLIC PROGRAMS MANAGER ======================== */}
      {activeTab === 'programs' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E7EF] rounded-[12px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold text-[#0D1B2A]">
                Daftar Program Tampil di Halaman Depan
              </h2>
              <p className="text-[13px] text-[#5B687A] mt-0.5">
                Hanya program berstatus <strong>Dipublikasikan</strong> yang tampil kepada pengunjung
                publik. Gunakan tombol urutan untuk mengatur posisi kartu di frontpage.
              </p>
            </div>
            <span className="text-[13px] font-mono-num text-[#4D5B6D] shrink-0">
              {publishedCount} tampil publik · {sortedPrograms.length - publishedCount} draf
            </span>
          </div>

          {sortedPrograms.length === 0 ? (
            <div className="bg-white border border-[#E2E7EF] rounded-[12px] p-10 text-center space-y-3">
              <p className="text-[15px] font-medium text-[#0D1B2A]">
                Belum ada program publik di katalog CMS.
              </p>
              <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openAddProgramModal}>
                Tambah Program Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPrograms.map((program, idx) => (
                <div
                  key={program.id}
                  className="bg-white border border-[#E2E7EF] rounded-[12px] p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4"
                >
                  <ProgramArtwork type={program.iconType} compact />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px]">
                      <span className="font-mono-num text-[#69778A]">#{idx + 1}</span>
                      <span className="text-[#CBD4E1]" aria-hidden="true">
                        ·
                      </span>
                      <span
                        className={
                          program.published
                            ? 'text-[#157347] font-semibold'
                            : 'text-[#69778A] font-semibold'
                        }
                      >
                        {program.published ? 'Dipublikasikan' : 'Draf (Tersembunyi)'}
                      </span>
                      <span className="text-[#CBD4E1]" aria-hidden="true">
                        ·
                      </span>
                      <span
                        className={
                          program.status === 'Pendaftaran Dibuka'
                            ? 'text-[#1D4ED8] font-medium'
                            : program.status === 'Akan Dibuka'
                              ? 'text-[#A65E00] font-medium'
                              : 'text-[#5B687A]'
                        }
                      >
                        {program.status}
                      </span>
                      <span className="text-[#CBD4E1]" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-[#5B687A]">{program.audience}</span>
                    </div>

                    <h3 className="text-[16px] font-semibold text-[#0D1B2A] truncate">
                      {program.name}
                    </h3>
                    <p className="text-[13px] text-[#4D5B6D] line-clamp-2">{program.summary}</p>
                    <p className="text-[12px] text-[#69778A]">
                      {program.learnItems.length} pokok bahasan · {program.requirements.length}{' '}
                      persyaratan · {program.documents.length} berkas
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => void reorderPublicProgram(program.id, 'up')}
                      aria-label={`Naikkan urutan ${program.name}`}
                      className="w-9 h-9 rounded-[8px] border border-[#E2E7EF] flex items-center justify-center text-[#4D5B6D] hover:bg-[#F2F4F8] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sortedPrograms.length - 1}
                      onClick={() => void reorderPublicProgram(program.id, 'down')}
                      aria-label={`Turunkan urutan ${program.name}`}
                      className="w-9 h-9 rounded-[8px] border border-[#E2E7EF] flex items-center justify-center text-[#4D5B6D] hover:bg-[#F2F4F8] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={program.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      onClick={() => void togglePublicProgramPublished(program.id)}
                    >
                      {program.published ? 'Sembunyikan' : 'Publikasikan'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Pencil className="w-3.5 h-3.5" />}
                      onClick={() => openEditProgramModal(program)}
                    >
                      Edit
                    </Button>
                    <button
                      type="button"
                      onClick={() => setDeletingProgram(program)}
                      aria-label={`Hapus ${program.name}`}
                      className="w-9 h-9 rounded-[8px] border border-[#FECACA] text-[#B42318] hover:bg-[#FEF2F2] flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================== TAB 2: HERO & HOMEPAGE SECTIONS ======================== */}
      {activeTab === 'hero' && (
        <form onSubmit={handleSaveContent} className="space-y-6">
          {/* Hero Block */}
          <div className="bg-white border border-[#E2E7EF] rounded-[12px] p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-[17px] font-semibold text-[#0D1B2A]">
                  Bagian Utama (Hero Banner)
                </h2>
                <p className="text-[13px] text-[#5B687A] mt-0.5">
                  Label paroki di atas judul otomatis mengikuti{' '}
                  <strong className="text-[#0D1B2A]">{settings.parishName}</strong> dari tab
                  Identitas &amp; Aturan Paroki.
                </p>
              </div>
              {canEditParishSettings && (
                <button
                  type="button"
                  onClick={() => setActiveTab('parish')}
                  className="text-[13px] font-medium text-[#082340] hover:underline cursor-pointer"
                >
                  Ubah Nama Paroki
                </button>
              )}
            </div>
            <TextInput
              label="Judul Utama Hero"
              required
              value={contentForm.heroTitle}
              onChange={(e) => setContentForm({ ...contentForm, heroTitle: e.target.value })}
              maxLength={160}
            />
            <Textarea
              label="Deskripsi Hero"
              required
              rows={3}
              value={contentForm.heroSubtitle}
              onChange={(e) => setContentForm({ ...contentForm, heroSubtitle: e.target.value })}
              maxLength={500}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Teks Tombol Utama"
                required
                value={contentForm.heroPrimaryCtaLabel}
                onChange={(e) =>
                  setContentForm({ ...contentForm, heroPrimaryCtaLabel: e.target.value })
                }
                maxLength={60}
              />
              <TextInput
                label="Teks Tombol Sekunder"
                required
                value={contentForm.heroSecondaryCtaLabel}
                onChange={(e) =>
                  setContentForm({ ...contentForm, heroSecondaryCtaLabel: e.target.value })
                }
                maxLength={60}
              />
            </div>
          </div>

          {/* Scripture Inspiration Block */}
          <div className="bg-white border border-[#E2E7EF] rounded-[12px] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[17px] font-semibold text-[#0D1B2A]">
                  Bagian Inspirasi Kitab Suci
                </h2>
                <p className="text-[13px] text-[#5B687A]">
                  Tampilkan kutipan ayat refleksi di bawah hero banner halaman depan.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-[13px] font-medium text-[#0D1B2A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentForm.showScriptureSection}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, showScriptureSection: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#082340]"
                />
                <span>Tampilkan</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Judul Bagian"
                value={contentForm.scriptureHeading}
                onChange={(e) =>
                  setContentForm({ ...contentForm, scriptureHeading: e.target.value })
                }
                maxLength={100}
              />
              <TextInput
                label="Sumber Ayat"
                placeholder="Contoh: Markus 10:14"
                value={contentForm.scriptureSource}
                onChange={(e) =>
                  setContentForm({ ...contentForm, scriptureSource: e.target.value })
                }
                maxLength={100}
              />
            </div>
            <Textarea
              label="Kutipan Ayat"
              rows={2}
              value={contentForm.scriptureQuote}
              onChange={(e) => setContentForm({ ...contentForm, scriptureQuote: e.target.value })}
              maxLength={500}
            />
            <TextInput
              label="Catatan Keterangan"
              value={contentForm.scriptureNote}
              onChange={(e) => setContentForm({ ...contentForm, scriptureNote: e.target.value })}
              maxLength={300}
            />
          </div>

          {/* Programs Section Heading & Roles Section */}
          <div className="bg-white border border-[#E2E7EF] rounded-[12px] p-5 sm:p-6 space-y-4">
            <h2 className="text-[17px] font-semibold text-[#0D1B2A]">
              Judul Bagian Program & Peran Umat
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Label Bagian Program"
                required
                value={contentForm.programsEyebrow}
                onChange={(e) =>
                  setContentForm({ ...contentForm, programsEyebrow: e.target.value })
                }
                maxLength={80}
              />
              <TextInput
                label="Judul Bagian Program"
                required
                value={contentForm.programsHeading}
                onChange={(e) =>
                  setContentForm({ ...contentForm, programsHeading: e.target.value })
                }
                maxLength={140}
              />
            </div>
            <Textarea
              label="Subjudul Bagian Program"
              rows={2}
              value={contentForm.programsSubtitle}
              onChange={(e) => setContentForm({ ...contentForm, programsSubtitle: e.target.value })}
              maxLength={300}
            />

            <div className="pt-4 border-t border-[#EEF1F6] space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-[15px] font-semibold text-[#0D1B2A]">
                  Bagian &ldquo;Untuk Siapa Catevia?&rdquo;
                </h3>
                <label className="inline-flex items-center gap-2 text-[13px] font-medium text-[#0D1B2A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contentForm.showRolesSection}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, showRolesSection: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#082340]"
                  />
                  <span>Tampilkan</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="Judul Bagian Peran"
                  value={contentForm.rolesHeading}
                  onChange={(e) => setContentForm({ ...contentForm, rolesHeading: e.target.value })}
                  maxLength={120}
                />
                <TextInput
                  label="Subjudul Bagian Peran"
                  value={contentForm.rolesSubtitle}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, rolesSubtitle: e.target.value })
                  }
                  maxLength={300}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={savingContent}
              icon={<Save className="w-4 h-4" />}
            >
              Simpan Perubahan Beranda
            </Button>
          </div>
        </form>
      )}

      {/* ======================== TAB 3: ABOUT, GUIDE & FAQ ======================== */}
      {activeTab === 'pages' && (
        <form onSubmit={handleSaveContent} className="space-y-6">
          {/* About Page */}
          <div className="bg-white border border-[#E2E7EF] rounded-[12px] p-5 sm:p-6 space-y-4">
            <h2 className="text-[17px] font-semibold text-[#0D1B2A]">Halaman Tentang Paroki</h2>
            <TextInput
              label="Judul Halaman Tentang"
              required
              value={contentForm.aboutTitle}
              onChange={(e) => setContentForm({ ...contentForm, aboutTitle: e.target.value })}
              maxLength={160}
            />
            <Textarea
              label="Narasi Tentang Pelayanan Katekese"
              required
              rows={4}
              value={contentForm.aboutContent}
              onChange={(e) => setContentForm({ ...contentForm, aboutContent: e.target.value })}
              maxLength={2000}
            />
            <Textarea
              label="Poin Fokus Pelayanan (1 baris per poin)"
              rows={4}
              hint="Maksimal 12 poin. Setiap baris akan tampil sebagai daftar keunggulan pelayanan."
              value={aboutHighlightsText}
              onChange={(e) => setAboutHighlightsText(e.target.value)}
            />
          </div>

          {/* Guide Steps */}
          <div className="bg-white border border-[#E2E7EF] rounded-[12px] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] font-semibold text-[#0D1B2A]">
                Halaman Panduan Pendaftaran
              </h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                disabled={contentForm.guideSteps.length >= 10}
                onClick={addGuideStep}
              >
                Tambah Langkah
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Judul Panduan"
                required
                value={contentForm.guideTitle}
                onChange={(e) => setContentForm({ ...contentForm, guideTitle: e.target.value })}
                maxLength={160}
              />
              <TextInput
                label="Pengantar Panduan"
                value={contentForm.guideIntro}
                onChange={(e) => setContentForm({ ...contentForm, guideIntro: e.target.value })}
                maxLength={500}
              />
            </div>

            <div className="space-y-3 pt-2">
              {contentForm.guideSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-[10px] bg-[#F8F9FB] border border-[#E2E7EF] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-mono-num font-semibold text-[#855E1E]">
                      Langkah 0{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeGuideStep(idx)}
                      className="text-[12px] font-medium text-[#B42318] hover:underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <TextInput
                      label="Judul Langkah"
                      value={step.title}
                      onChange={(e) => updateGuideStep(idx, { title: e.target.value })}
                      maxLength={120}
                    />
                    <TextInput
                      label="Penjelasan Singkat"
                      value={step.description}
                      onChange={(e) => updateGuideStep(idx, { description: e.target.value })}
                      maxLength={320}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white border border-[#E2E7EF] rounded-[12px] p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-semibold text-[#0D1B2A]">
                  Pertanyaan Umum (FAQ)
                </h2>
                <p className="text-[13px] text-[#5B687A]">
                  Tampil di bawah langkah pendaftaran pada halaman Panduan.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-[13px] font-medium text-[#0D1B2A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contentForm.showFaqSection}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, showFaqSection: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#082340]"
                  />
                  <span>Tampilkan FAQ</span>
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  disabled={contentForm.faqs.length >= 20}
                  onClick={addFaq}
                >
                  Tambah FAQ
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {contentForm.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-[10px] bg-[#F8F9FB] border border-[#E2E7EF] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-mono-num font-semibold text-[#4D5B6D]">
                      FAQ #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFaq(idx)}
                      className="text-[12px] font-medium text-[#B42318] hover:underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                  <TextInput
                    label="Pertanyaan"
                    value={faq.question}
                    onChange={(e) => updateFaq(idx, { question: e.target.value })}
                    maxLength={200}
                  />
                  <Textarea
                    label="Jawaban"
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => updateFaq(idx, { answer: e.target.value })}
                    maxLength={600}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={savingContent}
              icon={<Save className="w-4 h-4" />}
            >
              Simpan Halaman Tentang & Panduan
            </Button>
          </div>
        </form>
      )}

      {/* ======================== TAB 4: CONTACT & FOOTER ======================== */}
      {activeTab === 'contact' && (
        <form onSubmit={handleSaveContent} className="space-y-6">
          <div className="bg-white border border-[#E2E7EF] rounded-[12px] p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-[17px] font-semibold text-[#0D1B2A]">
                Lokasi &amp; Jam Layanan Sekretariat
              </h2>
              <p className="text-[13px] text-[#5B687A] mt-0.5">
                Tampil di halaman Kontak website publik.
              </p>
            </div>

            {/* Single-source-of-truth reference for Email & Phone */}
            <div className="px-4 py-3 rounded-[10px] bg-[#F8F9FB] border border-[#E2E7EF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px]">
              <div className="text-[#4D5B6D]">
                <span>Email &amp; Telepon resmi diambil otomatis dari Identitas Paroki: </span>
                <strong className="text-[#0D1B2A]">{settings.contactEmail}</strong>
                {settings.contactPhone && (
                  <>
                    <span className="mx-1.5 text-[#94A3B8]" aria-hidden="true">
                      ·
                    </span>
                    <strong className="text-[#0D1B2A]">{settings.contactPhone}</strong>
                  </>
                )}
              </div>
              {canEditParishSettings && (
                <button
                  type="button"
                  onClick={() => setActiveTab('parish')}
                  className="text-[13px] font-medium text-[#082340] hover:underline whitespace-nowrap cursor-pointer text-left sm:text-right"
                >
                  Ubah di Identitas Paroki
                </button>
              )}
            </div>

            <TextInput
              label="Judul Halaman Kontak"
              required
              value={contentForm.contactTitle}
              onChange={(e) => setContentForm({ ...contentForm, contactTitle: e.target.value })}
              maxLength={140}
            />
            <Textarea
              label="Pengantar Kontak"
              rows={2}
              value={contentForm.contactDescription}
              onChange={(e) =>
                setContentForm({ ...contentForm, contactDescription: e.target.value })
              }
              maxLength={500}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Alamat Lengkap Paroki"
                value={contentForm.contactAddress}
                onChange={(e) => setContentForm({ ...contentForm, contactAddress: e.target.value })}
                maxLength={300}
              />
              <TextInput
                label="Jam Layanan Sekretariat"
                value={contentForm.contactHours}
                onChange={(e) => setContentForm({ ...contentForm, contactHours: e.target.value })}
                maxLength={200}
              />
            </div>
          </div>

          <div className="bg-white border border-[#E2E7EF] rounded-[12px] p-5 sm:p-6 space-y-4">
            <h2 className="text-[17px] font-semibold text-[#0D1B2A]">Footer Website Publik</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Tagline Footer"
                value={contentForm.footerTagline}
                onChange={(e) => setContentForm({ ...contentForm, footerTagline: e.target.value })}
                maxLength={180}
              />
              <TextInput
                label="Teks Hak Cipta"
                value={contentForm.footerCopyright}
                onChange={(e) =>
                  setContentForm({ ...contentForm, footerCopyright: e.target.value })
                }
                maxLength={180}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={savingContent}
              icon={<Save className="w-4 h-4" />}
            >
              Simpan Kontak & Footer
            </Button>
          </div>
        </form>
      )}

      {/* ======================== PROGRAM ADD / EDIT MODAL ======================== */}
      <Modal
        open={programModalOpen}
        onClose={() => {
          if (!savingProgram) setProgramModalOpen(false);
        }}
        title={editingProgramId ? 'Edit Program Frontpage' : 'Tambah Program Frontpage'}
        description="Informasi di bawah akan ditampilkan langsung di kartu program dan halaman Detail Program publik."
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleSubmitProgram} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Nama Program"
              required
              placeholder="Contoh: Baptis Bayi / Komuni Pertama"
              value={programForm.name}
              onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
              error={programErrors.name}
              maxLength={140}
            />
            <SelectField
              label="Status Pendaftaran"
              value={programForm.status}
              onChange={(e) =>
                setProgramForm({
                  ...programForm,
                  status: e.target.value as PublicProgramStatus,
                })
              }
              options={STATUS_OPTIONS}
            />
            <SelectField
              label="Ilustrasi / Ikon Program"
              value={programForm.iconType}
              onChange={(e) =>
                setProgramForm({
                  ...programForm,
                  iconType: e.target.value as PublicProgramIconType,
                })
              }
              options={ICON_OPTIONS}
            />
            <SelectField
              label="Tautkan ke Program Portal (Opsional)"
              value={programForm.linkedProgram}
              onChange={(e) =>
                setProgramForm({
                  ...programForm,
                  linkedProgram: e.target.value as ProgramType | '',
                })
              }
              options={LINKED_PROGRAM_OPTIONS}
            />
            <TextInput
              label="Sasaran Peserta"
              required
              placeholder="Contoh: Calon baptis dewasa / OMK"
              value={programForm.audience}
              onChange={(e) => setProgramForm({ ...programForm, audience: e.target.value })}
              error={programErrors.audience}
              maxLength={140}
            />
            <TextInput
              label="Bentuk Kelas"
              required
              placeholder="Contoh: Tatap muka dan daring"
              value={programForm.mode}
              onChange={(e) => setProgramForm({ ...programForm, mode: e.target.value })}
              error={programErrors.mode}
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <TextInput
                label="Ringkasan Jadwal"
                placeholder="Contoh: Minggu · 09.00–11.00 WIB · Ruang Katekese Paroki"
                value={programForm.scheduleSummary}
                onChange={(e) =>
                  setProgramForm({ ...programForm, scheduleSummary: e.target.value })
                }
                maxLength={180}
              />
            </div>
            <TextInput
              label="Urutan Tampil"
              type="number"
              min={1}
              max={500}
              value={programForm.displayOrder}
              onChange={(e) =>
                setProgramForm({ ...programForm, displayOrder: Number(e.target.value) || 1 })
              }
            />
          </div>

          <Textarea
            label="Ringkasan Singkat (Tampil di Kartu Depan)"
            required
            rows={2}
            value={programForm.summary}
            onChange={(e) => setProgramForm({ ...programForm, summary: e.target.value })}
            error={programErrors.summary}
            maxLength={300}
          />

          <Textarea
            label="Penjelasan Lengkap (Tampil di Halaman Detail)"
            required
            rows={3}
            value={programForm.overview}
            onChange={(e) => setProgramForm({ ...programForm, overview: e.target.value })}
            error={programErrors.overview}
            maxLength={1200}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Textarea
              label="Hal yang Dipelajari"
              hint="1 baris per poin (maks 12)"
              rows={4}
              value={programForm.learnItemsText}
              onChange={(e) => setProgramForm({ ...programForm, learnItemsText: e.target.value })}
            />
            <Textarea
              label="Persyaratan Peserta"
              hint="1 baris per poin (maks 12)"
              rows={4}
              value={programForm.requirementsText}
              onChange={(e) => setProgramForm({ ...programForm, requirementsText: e.target.value })}
            />
            <Textarea
              label="Dokumen Disiapkan"
              hint="1 baris per poin (maks 12)"
              rows={4}
              value={programForm.documentsText}
              onChange={(e) => setProgramForm({ ...programForm, documentsText: e.target.value })}
            />
          </div>

          <Textarea
            label="Catatan Kebijakan Paroki (Opsional)"
            rows={2}
            value={programForm.policyNote}
            onChange={(e) => setProgramForm({ ...programForm, policyNote: e.target.value })}
            maxLength={500}
          />

          <label className="inline-flex items-center gap-2.5 text-[14px] font-medium text-[#0D1B2A] cursor-pointer">
            <input
              type="checkbox"
              checked={programForm.published}
              onChange={(e) => setProgramForm({ ...programForm, published: e.target.checked })}
              className="w-4 h-4 accent-[#082340]"
            />
            <span>Publikasikan langsung ke halaman depan website</span>
          </label>

          <div className="pt-4 border-t border-[#E2E7EF] flex justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              disabled={savingProgram}
              onClick={() => setProgramModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={savingProgram}
              icon={<Save className="w-4 h-4" />}
            >
              {editingProgramId ? 'Simpan Perubahan' : 'Tambahkan Program'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingProgram)}
        onClose={() => setDeletingProgram(null)}
        onConfirm={() => {
          if (!deletingProgram) return;
          const targetId = deletingProgram.id;
          setDeletingProgram(null);
          void deletePublicProgram(targetId);
        }}
        title="Hapus Program Publik?"
        description={
          deletingProgram
            ? `Program "${deletingProgram.name}" akan dihapus permanen dari katalog frontpage website.`
            : ''
        }
        confirmLabel="Hapus Program"
        destructive={true}
      />
    </div>
  );
};
