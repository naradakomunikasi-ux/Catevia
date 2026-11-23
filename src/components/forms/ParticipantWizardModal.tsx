import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, FileText, Save, Trash2, Upload } from 'lucide-react';
import {
  DocumentTypeKey,
  ParticipantStatus,
  PendingUploadFile,
  ProgramType,
} from '../../types/catevia';
import { LINGKUNGAN_OPTIONS } from '../../data/seedData';
import {
  DOCUMENT_TYPE_LABELS,
  formatFileSize,
  prepareDocumentUpload,
} from '../../utils/documentUpload';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SearchableSelect, SelectField, Textarea, TextInput } from '../ui/Input';

const PROGRAMS: ProgramType[] = [
  'Katekumen (Baptis Dewasa)',
  'Komuni Pertama',
  'Krisma (Penguatan)',
];

const STEPS = [
  { id: 1, label: 'Data Pribadi' },
  { id: 2, label: 'Program & Kelas' },
  { id: 3, label: 'Berkas & Ringkasan' },
];

const DOC_KEYS: DocumentTypeKey[] = ['ktpKk', 'suratBaptisAtauRekomendasi', 'pasFoto'];

export const ParticipantWizardModal: React.FC = () => {
  const {
    role,
    actualRole,
    currentUser,
    currentUserProfile,
    isRegistrationWizardOpen,
    wizardPreselectedProgram,
    closeRegistrationWizard,
    classes,
    participantDraft,
    saveParticipantDraft,
    clearParticipantDraft,
    addParticipant,
    showToast,
  } = useApp();

  const isSelfRegistration = role === 'general' || actualRole === 'general';

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [lingkungan, setLingkungan] = useState('');
  const [program, setProgram] = useState<ProgramType>('Katekumen (Baptis Dewasa)');
  const [classId, setClassId] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [initialStatus, setInitialStatus] = useState<ParticipantStatus>('Menunggu Verifikasi');
  const [documents, setDocuments] = useState({
    ktpKk: true,
    suratBaptisAtauRekomendasi: false,
    pasFoto: false,
  });
  const [pendingFiles, setPendingFiles] = useState<Partial<Record<DocumentTypeKey, PendingUploadFile>>>({});
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRefs = useRef<Partial<Record<DocumentTypeKey, HTMLInputElement | null>>>({});

  const resetFields = () => {
    const targetProgram: ProgramType = wizardPreselectedProgram || 'Katekumen (Baptis Dewasa)';
    const matchingClass = classes.find((c) => c.program === targetProgram) || classes[0];
    setStep(1);
    setFullName(
      isSelfRegistration ? currentUserProfile?.name || currentUser?.displayName || '' : ''
    );
    setBirthDate('');
    setPhone('');
    setEmail(isSelfRegistration ? currentUserProfile?.email || currentUser?.email || '' : '');
    setLingkungan('');
    setProgram(targetProgram);
    setClassId(matchingClass?.id || 'cls-kat-a');
    setSponsorName('');
    setInitialStatus('Menunggu Verifikasi');
    setDocuments({ ktpKk: false, suratBaptisAtauRekomendasi: false, pasFoto: false });
    setPendingFiles({});
    setNotes('');
    setErrors({});
  };

  useEffect(() => {
    if (!isRegistrationWizardOpen) return;
    if (participantDraft) {
      setStep(participantDraft.step || 1);
      setFullName(participantDraft.fullName);
      setBirthDate(participantDraft.birthDate);
      setPhone(participantDraft.phone);
      setEmail(participantDraft.email);
      setLingkungan(participantDraft.lingkungan);
      setProgram(wizardPreselectedProgram || participantDraft.program);
      setClassId(participantDraft.classId);
      setSponsorName(participantDraft.sponsorName);
      setDocuments(participantDraft.documents);
      setNotes(participantDraft.notes);
      setInitialStatus('Menunggu Verifikasi');
    } else {
      resetFields();
    }
    setPendingFiles({});
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegistrationWizardOpen, participantDraft, wizardPreselectedProgram]);

  const filteredClassOptions = useMemo(() => {
    const matching = classes.filter((c) => c.program === program);
    return matching.map((c) => ({
      value: c.id,
      label: c.name,
      sublabel: `${c.scheduleDay}, ${c.scheduleTime} · ${c.catechistName}`,
    }));
  }, [classes, program]);

  useEffect(() => {
    if (filteredClassOptions.length > 0 && !filteredClassOptions.some((o) => o.value === classId)) {
      setClassId(filteredClassOptions[0].value);
    }
  }, [filteredClassOptions, classId]);

  const lingkunganOptions = useMemo(
    () => LINGKUNGAN_OPTIONS.map((name) => ({ value: name, label: `Lingkungan ${name}` })),
    []
  );

  const validateStep = (targetStep: number): boolean => {
    const nextErrors: Record<string, string> = {};

    if (targetStep === 1) {
      if (!fullName.trim() || fullName.trim().length < 3) {
        nextErrors.fullName = 'Masukkan nama lengkap minimal 3 karakter.';
      }
      if (!birthDate) {
        nextErrors.birthDate = 'Tanggal lahir wajib diisi.';
      }
      if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
        nextErrors.phone = 'Masukkan nomor telepon/WhatsApp yang valid (minimal 9 digit).';
      }
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        nextErrors.email = 'Format alamat email belum sesuai (contoh: nama@email.com).';
      }
      if (!lingkungan) {
        nextErrors.lingkungan = 'Pilih Lingkungan tempat tinggal peserta.';
      }
    }

    if (targetStep === 2) {
      if (!classId) {
        nextErrors.classId = 'Pilih kelas pembinaan yang tersedia.';
      }
      if (sponsorName.trim().length < 2) {
        nextErrors.sponsorName = 'Nama wali baptis/krisma atau orang tua minimal 2 karakter.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(3, s + 1));
    }
  };

  const handleFilePick = async (docType: DocumentTypeKey, file: File | undefined) => {
    if (!file) return;
    try {
      const prepared = await prepareDocumentUpload(file, docType);
      setPendingFiles((prev) => ({ ...prev, [docType]: prepared }));
      setDocuments((prev) => ({ ...prev, [docType]: true }));
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

  const handleSaveDraft = () => {
    saveParticipantDraft({
      step,
      fullName,
      birthDate,
      phone,
      email,
      lingkungan,
      program,
      classId,
      sponsorName,
      documents,
      notes,
      savedAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    });
    closeRegistrationWizard();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1)) {
      setStep(1);
      return;
    }
    if (!validateStep(2)) {
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const uploads = Object.values(pendingFiles).filter(Boolean) as PendingUploadFile[];
      await addParticipant(
        {
          fullName: fullName.trim(),
          birthDate,
          phone: phone.trim(),
          email: email.trim() || '-',
          lingkungan,
          program,
          classId,
          sponsorName: sponsorName.trim(),
          status: isSelfRegistration ? 'Menunggu Verifikasi' : initialStatus,
          documents,
          notes: notes.trim() || undefined,
        },
        uploads
      );
      resetFields();
      closeRegistrationWizard();
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClassName = classes.find((c) => c.id === classId)?.name || 'Belum dipilih';

  return (
    <Modal
      open={isRegistrationWizardOpen}
      onClose={closeRegistrationWizard}
      title={
        isSelfRegistration
          ? 'Pendaftaran Mandiri Program Katekese'
          : 'Pendaftaran Peserta Katekese'
      }
      description={
        isSelfRegistration
          ? 'Lengkapi data diri, pilih kelas pembinaan, dan unggah berkas persyaratan Anda.'
          : 'Lengkapi tiga langkah singkat berikut untuk mendaftarkan calon penerima sakramen.'
      }
      maxWidthClass="max-w-2xl"
      footer={
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSaveDraft}
            >
              Simpan Draf
            </Button>
            {participantDraft && (
              <button
                type="button"
                onClick={() => {
                  clearParticipantDraft();
                  resetFields();
                }}
                className="text-[12px] text-[#B42318] hover:underline px-2 py-1 cursor-pointer"
              >
                Hapus Draf
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {step > 1 ? (
              <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
                Kembali
              </Button>
            ) : (
              <Button variant="secondary" onClick={closeRegistrationWizard}>
                Batal
              </Button>
            )}

            {step < 3 ? (
              <Button variant="primary" onClick={handleNext}>
                Lanjut ke Langkah {step + 1}
              </Button>
            ) : (
              <Button
                variant="primary"
                loading={isSubmitting}
                onClick={(e) => void handleSubmit(e)}
              >
                {isSelfRegistration ? 'Kirim Pendaftaran Saya' : 'Simpan & Daftarkan Peserta'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {participantDraft && (
        <div className="mb-5 px-3.5 py-2.5 rounded-[8px] bg-[#FBF6EC] border border-[#E5CFA6] text-[13px] text-[#6B4A14]">
          Melanjutkan draf tersimpan ({participantDraft.savedAt}).
        </div>
      )}

      {/* Stepper Indicator */}
      <ol aria-label="Tahap pendaftaran" className="grid grid-cols-3 gap-2 mb-6">
        {STEPS.map((s) => {
          const isCompleted = step > s.id;
          const isCurrent = step === s.id;
          return (
            <li
              key={s.id}
              className={`px-3 py-2.5 rounded-[8px] border text-[13px] flex items-center gap-2.5 ${
                isCurrent
                  ? 'border-[#082340] bg-[#EDF2F7]/70 text-[#082340] font-semibold'
                  : isCompleted
                    ? 'border-[#C4E4D1] bg-[#EDF8F1] text-[#157347] font-medium'
                    : 'border-[#E2E7EF] bg-[#F8F9FB] text-[#5B687A]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full text-[12px] font-mono-num flex items-center justify-center shrink-0 ${
                  isCurrent
                    ? 'bg-[#082340] text-white'
                    : isCompleted
                      ? 'bg-[#157347] text-white'
                      : 'bg-[#E2E7EF] text-[#4D5B6D]'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.id}
              </span>
              <span className="truncate">{s.label}</span>
            </li>
          );
        })}
      </ol>

      <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <TextInput
                label="Nama Lengkap Sesuai Identitas"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
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
                if (errors.birthDate) setErrors((prev) => ({ ...prev, birthDate: '' }));
              }}
              error={errors.birthDate}
            />

            <TextInput
              label="Nomor WhatsApp / Telepon"
              type="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              placeholder="Contoh: 0812-3456-7890"
              hint="Digunakan untuk pengingat jadwal pertemuan."
              error={errors.phone}
            />

            <TextInput
              label="Alamat Email (Opsional)"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
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
                if (errors.lingkungan) setErrors((prev) => ({ ...prev, lingkungan: '' }));
              }}
              options={lingkunganOptions}
              placeholder="Pilih Lingkungan..."
              searchPlaceholder="Ketik nama Lingkungan..."
              error={errors.lingkungan}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <SelectField
              label="Program Sakramen"
              required
              value={program}
              onChange={(e) => setProgram(e.target.value as ProgramType)}
              options={PROGRAMS.map((p) => ({ value: p, label: p }))}
            />

            <SearchableSelect
              label="Kelas Pembinaan"
              required
              value={classId}
              onChange={(val) => {
                setClassId(val);
                if (errors.classId) setErrors((prev) => ({ ...prev, classId: '' }));
              }}
              options={filteredClassOptions}
              placeholder="Pilih kelas yang tersedia..."
              searchPlaceholder="Cari nama kelas atau katekis..."
              error={errors.classId}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Nama Wali Baptis / Krisma / Orang Tua"
                required
                value={sponsorName}
                onChange={(e) => {
                  setSponsorName(e.target.value);
                  if (errors.sponsorName) setErrors((prev) => ({ ...prev, sponsorName: '' }));
                }}
                placeholder="Contoh: Elisabeth Gunawan"
                hint="Wali harus beragama Katolik dan telah menerima Krisma."
                error={errors.sponsorName}
              />

              {isSelfRegistration ? (
                <div className="space-y-1.5">
                  <span className="block text-[13px] font-medium text-[#0D1B2A]">
                    Status Pendaftaran Awal
                  </span>
                  <div className="min-h-[40px] px-3 py-2 rounded-[8px] border border-[#E2E7EF] bg-[#F8F9FB] text-[13px] text-[#4D5B6D] flex items-center">
                    Menunggu Verifikasi Sekretariat Paroki
                  </div>
                  <p className="text-[12px] text-[#5B687A]">
                    Sekretariat dan Katekis akan memeriksa kelengkapan berkas Anda setelah pendaftaran dikirim.
                  </p>
                </div>
              ) : (
                <SelectField
                  label="Status Pendaftaran Awal"
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value as ParticipantStatus)}
                  options={[
                    { value: 'Menunggu Verifikasi', label: 'Ajukan Verifikasi Sekretariat' },
                    { value: 'Aktif', label: 'Langsung Aktif Mengikuti Kelas' },
                  ]}
                />
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <p className="text-[13px] font-medium text-[#0D1B2A] mb-1">
                Checklist & Unggah Berkas Persyaratan
              </p>
              <p className="text-[12px] text-[#5B687A] mb-3">
                Anda dapat mencentang berkas fisik yang diterima dan/atau melampirkan salinan digital (JPG, PNG, WebP, atau PDF maks. 10 MB).
              </p>
              <div className="space-y-2.5">
                {DOC_KEYS.map((docKey) => {
                  const uploaded = pendingFiles[docKey];
                  return (
                    <div
                      key={docKey}
                      className="px-3.5 py-3 rounded-[8px] border border-[#E2E7EF] bg-[#FAFBFC] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <label className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={documents[docKey]}
                          onChange={(e) =>
                            setDocuments((prev) => ({ ...prev, [docKey]: e.target.checked }))
                          }
                          className="mt-0.5 w-4 h-4 accent-[#082340] rounded cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="block text-[13px] font-medium text-[#0D1B2A]">
                            {DOCUMENT_TYPE_LABELS[docKey]}
                          </span>
                          {uploaded && (
                            <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#157347] truncate">
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{uploaded.fileName}</span>
                              <span className="font-mono-num shrink-0">
                                ({formatFileSize(uploaded.fileSizeBytes)})
                              </span>
                            </span>
                          )}
                        </div>
                      </label>

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
                            className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[#B42318] hover:bg-[#FEF2F2] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Textarea
              label="Catatan Tambahan (Opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Peserta membutuhkan pendampingan jadwal khusus atau berkas menyusul minggu depan."
            />

            <div className="rounded-[8px] border border-[#E2E7EF] bg-[#F8F9FB] p-4">
              <p className="text-[13px] font-semibold text-[#0D1B2A] mb-2.5">
                Ringkasan Pendaftaran
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                <div>
                  <dt className="text-[#5B687A]">Nama Peserta</dt>
                  <dd className="font-medium text-[#0D1B2A]">{fullName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-[#5B687A]">Lingkungan</dt>
                  <dd className="font-medium text-[#0D1B2A]">
                    {lingkungan ? `Lingkungan ${lingkungan}` : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5B687A]">Program & Kelas</dt>
                  <dd className="font-medium text-[#0D1B2A]">
                    {program} · {selectedClassName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5B687A]">Wali / Orang Tua</dt>
                  <dd className="font-medium text-[#0D1B2A]">{sponsorName || '-'}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
