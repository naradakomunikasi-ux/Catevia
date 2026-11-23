import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';
import {
  DocumentTypeKey,
  PendingUploadFile,
  ProgramType,
} from '../../types/catevia';
import { INITIAL_CLASSES, LINGKUNGAN_OPTIONS } from '../../data/seedData';
import {
  DOCUMENT_TYPE_LABELS,
  formatFileSize,
  prepareDocumentUpload,
} from '../../utils/documentUpload';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { SearchableSelect, SelectField, Textarea, TextInput } from '../ui/Input';

const PROGRAMS: ProgramType[] = [
  'Katekumen (Baptis Dewasa)',
  'Komuni Pertama',
  'Krisma (Penguatan)',
];

const DOC_KEYS: DocumentTypeKey[] = ['ktpKk', 'suratBaptisAtauRekomendasi', 'pasFoto'];

interface PublicRegistrationFormProps {
  preselectedProgram?: ProgramType | null;
  onBrowsePrograms?: () => void;
}

export const PublicRegistrationForm: React.FC<PublicRegistrationFormProps> = ({
  preselectedProgram,
  onBrowsePrograms,
}) => {
  const {
    currentUser,
    currentUserProfile,
    role,
    classes,
    participants,
    publicPrograms,
    frontpageContent,
    settings,
    openPortal,
    isSubmittingFrontpageRegistration,
    lastFrontpageRegistrationResult,
    clearFrontpageRegistrationResult,
    submitFrontpageRegistration,
    showToast,
  } = useApp();

  const resolvedParishName = currentUser ? settings.parishName : frontpageContent.parishLabel;
  const resolvedContactEmail = currentUser ? settings.contactEmail : frontpageContent.contactEmail;
  const resolvedContactPhone = currentUser ? settings.contactPhone : frontpageContent.contactPhone;

  const availableClasses = classes.length > 0 ? classes : INITIAL_CLASSES;

  const existingOwnRegistration = useMemo(() => {
    if (!currentUser || role !== 'general') return null;
    return participants.find((p) => p.ownerUid === currentUser.uid) || null;
  }, [currentUser, participants, role]);

  const [program, setProgram] = useState<ProgramType>(
    preselectedProgram || 'Katekumen (Baptis Dewasa)'
  );
  const [classId, setClassId] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [lingkungan, setLingkungan] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [notes, setNotes] = useState('');
  const [pendingFiles, setPendingFiles] = useState<
    Partial<Record<DocumentTypeKey, PendingUploadFile>>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUserEditedIdentity, setHasUserEditedIdentity] = useState(false);

  const fileInputRefs = useRef<Partial<Record<DocumentTypeKey, HTMLInputElement | null>>>({});

  // Sync preselected program when user clicks "Daftar" from a specific program card
  useEffect(() => {
    if (preselectedProgram) {
      setProgram(preselectedProgram);
    }
  }, [preselectedProgram]);

  // Gently pre-fill identity from signed-in Google account if user hasn't typed anything yet
  useEffect(() => {
    if (!currentUser || hasUserEditedIdentity || role !== 'general') return;
    if (!fullName) {
      setFullName(currentUserProfile?.name || currentUser.displayName || '');
    }
    if (!email) {
      setEmail(currentUserProfile?.email || currentUser.email || '');
    }
  }, [currentUser, currentUserProfile, email, fullName, hasUserEditedIdentity, role]);

  const classOptions = useMemo(() => {
    const matching = availableClasses.filter((c) => c.program === program);
    const list = matching.length > 0 ? matching : availableClasses;
    return list.map((c) => ({
      value: c.id,
      label: c.name,
      sublabel: `${c.scheduleDay}, ${c.scheduleTime} · ${c.room}`,
    }));
  }, [availableClasses, program]);

  useEffect(() => {
    if (classOptions.length > 0 && !classOptions.some((o) => o.value === classId)) {
      setClassId(classOptions[0].value);
    }
  }, [classOptions, classId]);

  const lingkunganOptions = useMemo(
    () => LINGKUNGAN_OPTIONS.map((name) => ({ value: name, label: `Lingkungan ${name}` })),
    []
  );

  // Pull contextual info for the chosen program straight from CMS publicPrograms
  const matchedCmsProgram = useMemo(() => {
    return (
      publicPrograms.find((p) => p.published && p.linkedProgram === program) ||
      publicPrograms.find((p) => p.linkedProgram === program) ||
      null
    );
  }, [publicPrograms, program]);

  const clearFieldError = (key: string) => {
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleFilePick = async (docType: DocumentTypeKey, file: File | undefined) => {
    if (!file) return;
    try {
      const prepared = await prepareDocumentUpload(file, docType);
      setPendingFiles((prev) => ({ ...prev, [docType]: prepared }));
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Berkas tidak dapat dilampirkan',
        description: err instanceof Error ? err.message : 'Periksa format dan ukuran berkas.',
      });
    } finally {
      const el = fileInputRefs.current[docType];
      if (el) el.value = '';
    }
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 3) {
      nextErrors.fullName = 'Masukkan nama lengkap minimal 3 karakter.';
    }
    if (!birthDate) {
      nextErrors.birthDate = 'Tanggal lahir wajib diisi.';
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      nextErrors.phone = 'Masukkan nomor WhatsApp/telepon yang valid (minimal 9 digit).';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Masukkan alamat email yang valid (contoh: nama@email.com).';
    }
    if (!lingkungan) {
      nextErrors.lingkungan = 'Pilih Lingkungan domisili Anda.';
    }
    if (!classId) {
      nextErrors.classId = 'Pilih jadwal kelas pembinaan yang tersedia.';
    }
    if (!sponsorName.trim() || sponsorName.trim().length < 2) {
      nextErrors.sponsorName = 'Masukkan nama wali baptis/krisma atau orang tua minimal 2 karakter.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFullName('');
    setBirthDate('');
    setPhone('');
    setEmail(currentUser?.email || '');
    setLingkungan('');
    setSponsorName('');
    setNotes('');
    setPendingFiles({});
    setErrors({});
    setHasUserEditedIdentity(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast({
        type: 'warning',
        title: 'Periksa kembali isian formulir',
        description: 'Masih ada kolom wajib yang belum dilengkapi dengan benar.',
      });
      return;
    }

    const uploads = Object.values(pendingFiles).filter(Boolean) as PendingUploadFile[];
    const docsFlags = {
      ktpKk: Boolean(pendingFiles.ktpKk),
      suratBaptisAtauRekomendasi: Boolean(pendingFiles.suratBaptisAtauRekomendasi),
      pasFoto: Boolean(pendingFiles.pasFoto),
    };

    const result = await submitFrontpageRegistration(
      {
        fullName: fullName.trim(),
        birthDate,
        phone: phone.trim(),
        email: email.trim(),
        lingkungan,
        program,
        classId,
        sponsorName: sponsorName.trim(),
        documents: docsFlags,
        notes: notes.trim() || undefined,
      },
      uploads
    );

    if (result) {
      resetForm();
    }
  };

  // Confirmation card after successful Firestore submission
  if (lastFrontpageRegistrationResult) {
    return (
      <div className="bg-white border border-[#E2E7EF] rounded-[16px] p-6 sm:p-10 max-w-3xl mx-auto">
        <div className="flex items-start gap-4 pb-6 border-b border-[#EEF1F6]">
          <div className="w-11 h-11 rounded-[10px] bg-[#EDF8F1] text-[#157347] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-[#157347]">Pendaftaran Diterima</p>
            <h3 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-[#082340]">
              Terima kasih, pendaftaran katekese Anda telah tercatat
            </h3>
            <p className="text-[14px] text-[#4D5B6D] leading-relaxed">
              Sekretariat {resolvedParishName} dan Katekis pendamping akan meninjau data serta
              berkas Anda. Pantau perkembangan verifikasi, jadwal kelas, dan materi pembinaan
              langsung di Portal Peserta.
            </p>
          </div>
        </div>

        <dl className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-[14px] border-b border-[#EEF1F6]">
          <div>
            <dt className="text-[12px] text-[#5B687A]">Nomor Registrasi</dt>
            <dd className="mt-1 text-[16px] font-bold font-mono-num text-[#082340]">
              {lastFrontpageRegistrationResult.code}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-[#5B687A]">Status Pendaftaran</dt>
            <dd className="mt-1 font-semibold text-[#855E1E]">
              {lastFrontpageRegistrationResult.status}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-[#5B687A]">Nama Calon Peserta</dt>
            <dd className="mt-1 font-medium text-[#0D1B2A]">
              {lastFrontpageRegistrationResult.fullName}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-[#5B687A]">Program Sakramen</dt>
            <dd className="mt-1 font-medium text-[#0D1B2A]">
              {lastFrontpageRegistrationResult.program}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-[#5B687A]">Kelas Pembinaan</dt>
            <dd className="mt-1 font-medium text-[#0D1B2A]">
              {lastFrontpageRegistrationResult.className}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-[#5B687A]">Lingkungan & Tanggal Daftar</dt>
            <dd className="mt-1 text-[#0D1B2A]">
              Lingkungan {lastFrontpageRegistrationResult.lingkungan}{' '}
              <span className="text-[#94A3B8]" aria-hidden="true">
                ·
              </span>{' '}
              <span className="font-mono-num">{lastFrontpageRegistrationResult.registeredAt}</span>
            </dd>
          </div>
        </dl>

        <div className="pt-6 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              clearFrontpageRegistrationResult();
              openPortal();
            }}
          >
            <span>Buka Portal Peserta</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => {
              clearFrontpageRegistrationResult();
              resetForm();
            }}
          >
            Daftarkan Anggota Keluarga Lain
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Registration Form Card */}
      <div className="lg:col-span-8 bg-white border border-[#E2E7EF] rounded-[16px] p-6 sm:p-8">
        {existingOwnRegistration && (
          <div className="mb-6 p-4 rounded-[10px] bg-[#F4F8FD] border border-[#D8E5F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 text-[13px]">
              <p className="font-semibold text-[#082340]">
                Akun Anda sudah memiliki pendaftaran aktif ({existingOwnRegistration.code})
              </p>
              <p className="text-[#42546A]">
                {existingOwnRegistration.fullName} · {existingOwnRegistration.program} · Status:{' '}
                <span className="font-medium text-[#082340]">{existingOwnRegistration.status}</span>
                . Anda tetap dapat mengisi formulir di bawah ini untuk mendaftarkan anggota keluarga
                lain.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={openPortal}>
              Buka Portal Saya
            </Button>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-7">
          {/* Section 01: Program & Class */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[12px] font-mono-num font-semibold text-[#855E1E]">01</p>
              <h3 className="text-[17px] font-semibold text-[#082340]">
                Program Sakramen & Kelas Pembinaan
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Program Katekese"
                required
                value={program}
                onChange={(e) => setProgram(e.target.value as ProgramType)}
                options={PROGRAMS.map((p) => ({ value: p, label: p }))}
              />

              <SearchableSelect
                label="Pilihan Kelas & Jadwal"
                required
                value={classId}
                onChange={(val) => {
                  setClassId(val);
                  clearFieldError('classId');
                }}
                options={classOptions}
                placeholder="Pilih jadwal kelas..."
                searchPlaceholder="Cari nama kelas atau hari..."
                error={errors.classId}
              />
            </div>

            <TextInput
              label="Nama Wali Baptis / Krisma / Orang Tua"
              required
              value={sponsorName}
              onChange={(e) => {
                setSponsorName(e.target.value);
                clearFieldError('sponsorName');
              }}
              placeholder="Contoh: Elisabeth Gunawan"
              hint="Untuk Komuni Pertama isi nama Orang Tua; untuk Baptis Dewasa/Krisma isi nama Wali yang beragama Katolik."
              error={errors.sponsorName}
            />
          </div>

          {/* Section 02: Participant Personal Info */}
          <div className="pt-6 border-t border-[#EEF1F6] space-y-4">
            <div className="space-y-1">
              <p className="text-[12px] font-mono-num font-semibold text-[#855E1E]">02</p>
              <h3 className="text-[17px] font-semibold text-[#082340]">Data Diri Calon Peserta</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <TextInput
                  label="Nama Lengkap Sesuai KTP / Akta Lahir"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setHasUserEditedIdentity(true);
                    setFullName(e.target.value);
                    clearFieldError('fullName');
                  }}
                  placeholder="Contoh: Yohanes Budi Santoso"
                  error={errors.fullName}
                />
              </div>

              <TextInput
                label="Tanggal Lahir"
                type="date"
                required
                value={birthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  clearFieldError('birthDate');
                }}
                error={errors.birthDate}
              />

              <TextInput
                label="Nomor WhatsApp / Telepon Aktif"
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearFieldError('phone');
                }}
                placeholder="Contoh: 0812-3456-7890"
                hint="Digunakan Katekis untuk konfirmasi jadwal kelas."
                error={errors.phone}
              />

              <TextInput
                label="Alamat Email Aktif"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setHasUserEditedIdentity(true);
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                placeholder="nama@email.com"
                error={errors.email}
              />

              <SearchableSelect
                label="Lingkungan Domisili"
                required
                value={lingkungan}
                onChange={(val) => {
                  setLingkungan(val);
                  clearFieldError('lingkungan');
                }}
                options={lingkunganOptions}
                placeholder="Pilih Lingkungan..."
                searchPlaceholder="Ketik nama Lingkungan..."
                error={errors.lingkungan}
              />
            </div>
          </div>

          {/* Section 03: Optional Document Uploads & Notes */}
          <div className="pt-6 border-t border-[#EEF1F6] space-y-4">
            <div className="space-y-1">
              <p className="text-[12px] font-mono-num font-semibold text-[#855E1E]">03</p>
              <h3 className="text-[17px] font-semibold text-[#082340]">
                Unggah Berkas Persyaratan (Opsional)
              </h3>
              <p className="text-[13px] text-[#5B687A]">
                Anda dapat melampirkan foto/PDF berkas sekarang (JPG, PNG, WebP, atau PDF maks. 10
                MB), atau menyusulkannya kemudian di Portal Peserta.
              </p>
            </div>

            <div className="divide-y divide-[#EEF1F6] border border-[#E2E7EF] rounded-[10px]">
              {DOC_KEYS.map((docKey) => {
                const uploaded = pendingFiles[docKey];
                return (
                  <div
                    key={docKey}
                    className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#0D1B2A]">
                        {DOCUMENT_TYPE_LABELS[docKey]}
                      </p>
                      {uploaded ? (
                        <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#157347] truncate">
                          <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{uploaded.fileName}</span>
                          <span className="font-mono-num shrink-0">
                            ({formatFileSize(uploaded.fileSizeBytes)})
                          </span>
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[12px] text-[#69778A]">
                          Belum dilampirkan · Dapat menyusul di Portal
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        ref={(el) => {
                          fileInputRefs.current[docKey] = el;
                        }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="sr-only"
                        onChange={(e) => void handleFilePick(docKey, e.target.files?.[0])}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Upload className="w-3.5 h-3.5" />}
                        onClick={() => fileInputRefs.current[docKey]?.click()}
                      >
                        {uploaded ? 'Ganti' : 'Unggah'}
                      </Button>
                      {uploaded && (
                        <button
                          type="button"
                          aria-label={`Hapus lampiran ${DOCUMENT_TYPE_LABELS[docKey]}`}
                          onClick={() =>
                            setPendingFiles((prev) => {
                              const next = { ...prev };
                              delete next[docKey];
                              return next;
                            })
                          }
                          className="w-9 h-9 rounded-[7px] flex items-center justify-center text-[#B42318] hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Textarea
              label="Catatan Tambahan untuk Sekretariat (Opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pernah dibaptis di paroki asal, atau membutuhkan penyesuaian jadwal kelas."
            />
          </div>

          {/* Submit Footer */}
          <div className="pt-6 border-t border-[#EEF1F6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-2.5 text-[12px] text-[#5B687A] max-w-md">
              <ShieldCheck
                className="w-4 h-4 text-[#082340] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>
                {currentUser ? (
                  <>
                    Mendaftar dengan akun terverifikasi{' '}
                    <strong className="font-medium text-[#0D1B2A]">{currentUser.email}</strong>.
                    Data tersimpan aman di sistem Paroki.
                  </>
                ) : (
                  <>
                    Saat dikirim, Anda akan diminta verifikasi singkat dengan akun Google agar data
                    terlindungi dan Anda dapat memantau status di Portal Peserta.
                  </>
                )}
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmittingFrontpageRegistration}
            >
              <span>
                {currentUser
                  ? 'Kirim Pendaftaran Katekese'
                  : 'Verifikasi Google & Kirim Pendaftaran'}
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      </div>

      {/* Right Contextual Sidebar */}
      <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
        {/* Selected Program Summary (Synced from CMS) */}
        <div className="bg-white border border-[#E2E7EF] rounded-[14px] p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-[12px] font-semibold text-[#855E1E]">Program Dipilih</p>
            <h3 className="text-[18px] font-bold text-[#082340] leading-snug">{program}</h3>
            {matchedCmsProgram && (
              <p className="text-[13px] text-[#5B687A]">
                {matchedCmsProgram.audience} · {matchedCmsProgram.mode}
              </p>
            )}
          </div>

          {matchedCmsProgram?.scheduleSummary && (
            <div className="flex items-start gap-2.5 pt-3 border-t border-[#EEF1F6] text-[13px] text-[#334155]">
              <CalendarDays
                className="w-4 h-4 text-[#855E1E] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{matchedCmsProgram.scheduleSummary}</span>
            </div>
          )}

          {matchedCmsProgram && matchedCmsProgram.documents.length > 0 && (
            <div className="pt-3 border-t border-[#EEF1F6] space-y-2">
              <p className="text-[13px] font-semibold text-[#0D1B2A]">
                Dokumen yang Perlu Disiapkan
              </p>
              <ul className="space-y-1.5 list-disc pl-4 text-[13px] text-[#4D5B6D] leading-relaxed">
                {matchedCmsProgram.documents.map((docItem, idx) => (
                  <li key={idx}>{docItem}</li>
                ))}
              </ul>
            </div>
          )}

          {onBrowsePrograms && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onBrowsePrograms}
                className="text-[13px] font-semibold text-[#082340] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat detail semua program</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* 3-Step Journey Guide */}
        <div className="bg-white border border-[#E2E7EF] rounded-[14px] p-6 space-y-4">
          <h3 className="text-[16px] font-semibold text-[#082340]">Alur Setelah Mendaftar</h3>
          <ol className="space-y-3.5 text-[13px]">
            <li className="flex items-start gap-3">
              <span className="font-mono-num font-semibold text-[#855E1E] shrink-0">01.</span>
              <div>
                <p className="font-medium text-[#0D1B2A]">Verifikasi Berkas Sekretariat</p>
                <p className="text-[#5B687A] mt-0.5 leading-relaxed">
                  Katekis dan Sekretariat Paroki memeriksa data diri serta lampiran dokumen Anda.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-mono-num font-semibold text-[#855E1E] shrink-0">02.</span>
              <div>
                <p className="font-medium text-[#0D1B2A]">Persetujuan & Penempatan Kelas</p>
                <p className="text-[#5B687A] mt-0.5 leading-relaxed">
                  Setelah disetujui Pastor Paroki, status Anda berubah menjadi Aktif mengikuti kelas.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-mono-num font-semibold text-[#855E1E] shrink-0">03.</span>
              <div>
                <p className="font-medium text-[#0D1B2A]">Pantau Kehadiran & Surat PDF</p>
                <p className="text-[#5B687A] mt-0.5 leading-relaxed">
                  Akses jadwal pertemuan, materi doa, dan unduh Surat Keterangan Kesiapan Sakramen.
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Secretariat Help */}
        <div className="bg-white border border-[#E2E7EF] rounded-[14px] p-6 space-y-3">
          <h3 className="text-[15px] font-semibold text-[#082340]">Butuh Bantuan Pendaftaran?</h3>
          <p className="text-[13px] text-[#5B687A] leading-relaxed">
            Tim Sekretariat {resolvedParishName} siap membantu bila Anda mengalami kendala pengisian
            formulir.
          </p>
          <div className="pt-1 space-y-2 text-[13px] text-[#334155]">
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#082340] shrink-0" aria-hidden="true" />
              <span>{resolvedContactPhone}</span>
            </p>
            <p className="flex items-center gap-2 break-all">
              <Mail className="w-4 h-4 text-[#082340] shrink-0" aria-hidden="true" />
              <span>{resolvedContactEmail}</span>
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
};
