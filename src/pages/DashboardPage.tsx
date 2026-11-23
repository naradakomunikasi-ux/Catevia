import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileBadge2,
  FileCheck2,
  Plus,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { hasPermission, ROLE_PROFILES } from '../data/permissions';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { ParticipantDocumentsPanel } from '../components/documents/ParticipantDocumentsPanel';
import { CertificatePreviewModal } from '../components/certificates/CertificatePreviewModal';

export const DashboardPage: React.FC = () => {
  const [showMyCertificate, setShowMyCertificate] = useState(false);
  const {
    currentUser,
    currentUserProfile,
    role,
    isPreviewingRole,
    participants,
    classes,
    approvals,
    materials,
    users,
    settings,
    navigate,
    openRegistrationWizard,
    jumpToParticipantDetail,
  } = useApp();

  const profile = ROLE_PROFILES[role];
  const signedInName =
    currentUserProfile?.name || currentUser?.displayName || profile.personName;
  const firstName = signedInName.split(' ')[0] || 'Pengguna';

  const pendingApprovals = approvals.filter((a) => a.status === 'Menunggu');
  const revisionParticipants = participants.filter((p) => p.status === 'Perlu Revisi');
  const unsubmittedVerifications = participants.filter(
    (p) =>
      p.status === 'Menunggu Verifikasi' &&
      !approvals.some((a) => a.participantId === p.id && a.status === 'Menunggu')
  );
  const readyForSacrament = participants.filter((p) => p.status === 'Siap Sakramen');
  const activeParticipants = participants.filter(
    (p) => p.status === 'Aktif' || p.status === 'Menunggu Verifikasi' || p.status === 'Siap Sakramen'
  );
  const upcomingSessions = classes
    .flatMap((cls) =>
      cls.sessions
        .filter((s) => !s.completed)
        .map((s) => ({
          ...s,
          className: cls.name,
          classCode: cls.code,
          room: cls.room,
          time: cls.scheduleTime,
        }))
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const avgAttendance = participants.length
    ? Math.round(
        (participants.reduce((sum, p) => sum + p.attendanceCount / Math.max(1, p.totalSessions), 0) /
          participants.length) *
          100
      )
    : 0;

  // =========================================================================
  // GENERAL USER VIEW (Simple, welcoming, jargon-free, real document upload)
  // =========================================================================
  if (role === 'general') {
    const ownRecord = participants.find((p) => p.ownerUid === currentUser?.uid);
    const myRecord = ownRecord || (isPreviewingRole ? participants.find((p) => p.id === 'p-01') || participants[0] : undefined);
    const myClass = myRecord ? classes.find((c) => c.id === myRecord.classId) : undefined;
    const nextSession = myClass?.sessions.find((s) => !s.completed);
    const myMaterials = materials.filter(
      (m) => !myRecord || m.program === myRecord.program || m.program === 'Semua Program'
    );
    const completedMaterials = myMaterials.filter((m) => m.completedByCurrentUser).length;
    const myAttendancePct = myRecord
      ? Math.round((myRecord.attendanceCount / Math.max(1, myRecord.totalSessions)) * 100)
      : 0;
    const docsCompletedCount = myRecord
      ? [
          myRecord.documents.ktpKk,
          myRecord.documents.suratBaptisAtauRekomendasi,
          myRecord.documents.pasFoto,
        ].filter(Boolean).length
      : 0;

    const isReadyOrCompleted =
      myRecord?.status === 'Siap Sakramen' || myRecord?.status === 'Selesai';

    return (
      <div className="space-y-8">
        {/* SECTION A — PAGE OVERVIEW */}
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[24px] sm:text-[26px] font-bold tracking-tight text-[#0D1B2A]">
              Selamat datang, {myRecord ? myRecord.fullName.split(' ')[0] : firstName}
            </h1>
            <p className="mt-1 text-[14px] text-[#4D5B6D]">
              Pantau jadwal pertemuan katekese, unggah kelengkapan berkas, dan baca materi pembinaan Anda di{' '}
              {settings.parishName}.
            </p>
          </div>
          {!myRecord ? (
            <Button
              variant="primary"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => openRegistrationWizard()}
            >
              Daftar Program Katekese
            </Button>
          ) : isReadyOrCompleted ? (
            <Button
              variant="primary"
              icon={<FileBadge2 className="w-4 h-4" />}
              onClick={() => setShowMyCertificate(true)}
            >
              Lihat Surat Keterangan (PDF)
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={<BookOpen className="w-4 h-4" />}
              onClick={() => navigate('materials')}
            >
              Buka Materi Pembinaan
            </Button>
          )}
        </section>

        {/* Revision Notice Banner when Pastor/Katekis requested fixes */}
        {myRecord?.status === 'Perlu Revisi' && (
          <section
            role="alert"
            className="rounded-[10px] border border-[#F5C2C7] bg-[#FEF2F2] p-4 sm:p-5 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-[#B42318] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#912018]">
                Berkas Pendaftaran Memerlukan Perbaikan
              </p>
              <p className="mt-1 text-[13px] text-[#7A271A] leading-relaxed">
                {myRecord.notes ||
                  'Sekretariat atau Pastor Paroki meminta Anda melengkapi atau memperbarui berkas persyaratan di bagian Unggah Berkas di bawah ini.'}
              </p>
            </div>
          </section>
        )}

        {/* SECTION B — KEY INFORMATION */}
        <section
          aria-label="Ringkasan perjalanan iman saya"
          className="bg-white border border-[#E2E7EF] rounded-[10px] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EEF1F6]"
        >
          <div className="p-5">
            <p className="text-[13px] text-[#5B687A]">Program Saya</p>
            <p className="mt-1.5 text-[16px] font-semibold text-[#0D1B2A]">
              {myRecord?.program || 'Belum Terdaftar'}
            </p>
            <p className="mt-1 text-[12px] text-[#5B687A]">
              {myRecord
                ? `Lingkungan ${myRecord.lingkungan}`
                : 'Klik Daftar Program Katekese untuk mendaftar mandiri'}
            </p>
          </div>
          <div className="p-5">
            <p className="text-[13px] text-[#5B687A]">Kehadiran Pertemuan</p>
            <p className="mt-1.5 text-[24px] font-bold font-mono-num text-[#082340]">
              {myRecord ? `${myRecord.attendanceCount}/${myRecord.totalSessions}` : '0/0'}
            </p>
            <p className="mt-1 text-[12px] text-[#157347] tabular-nums">
              {myAttendancePct}% (Syarat min. {settings.minimumAttendancePercent}%)
            </p>
          </div>
          <div className="p-5">
            <p className="text-[13px] text-[#5B687A]">Kelengkapan Berkas</p>
            <p className="mt-1.5 text-[24px] font-bold font-mono-num text-[#082340]">
              {docsCompletedCount}/3
            </p>
            <p className="mt-1 text-[12px] text-[#5B687A]">
              {docsCompletedCount === 3
                ? 'Semua berkas lengkap'
                : `${3 - docsCompletedCount} berkas perlu dilengkapi`}
            </p>
          </div>
          <div className="p-5">
            <p className="text-[13px] text-[#5B687A]">Materi Selesai Dibaca</p>
            <p className="mt-1.5 text-[24px] font-bold font-mono-num text-[#082340]">
              {completedMaterials}/{myMaterials.length}
            </p>
            <p className="mt-1 text-[12px] text-[#5B687A]">
              Status: {myRecord?.status || 'Belum Terdaftar'}
            </p>
          </div>
        </section>

        {/* SECTION C — ACTION REQUIRED + SECTION E — QUICK ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white border border-[#E2E7EF] rounded-[10px] p-5 sm:p-6">
            <h2 className="text-[18px] font-semibold text-[#0D1B2A]">Langkah Berikutnya untuk Anda</h2>
            <p className="text-[13px] text-[#5B687A] mt-0.5">
              Hal penting yang perlu diperhatikan sebelum penerimaan sakramen.
            </p>

            <div className="mt-4 divide-y divide-[#EEF1F6]">
              {!myRecord && (
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-medium text-[#0D1B2A]">
                      Lengkapi Formulir Pendaftaran Program Katekese
                    </p>
                    <p className="text-[13px] text-[#5B687A] mt-0.5">
                      Pilih program sakramen, jadwal kelas, dan unggah salinan berkas langsung dari portal ini.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openRegistrationWizard()}
                  >
                    Daftar Sekarang
                  </Button>
                </div>
              )}

              {myRecord && isReadyOrCompleted && (
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-medium text-[#157347]">
                      Anda dinyatakan {myRecord.status} oleh Paroki
                    </p>
                    <p className="text-[13px] text-[#5B687A] mt-0.5">
                      Pratinjau dan unduh Surat Keterangan Kesiapan Sakramen resmi Anda dalam format PDF.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<FileBadge2 className="w-4 h-4" />}
                    onClick={() => setShowMyCertificate(true)}
                  >
                    Unduh Surat PDF
                  </Button>
                </div>
              )}

              {nextSession && myClass && (
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-medium text-[#0D1B2A]">
                      Pertemuan Berikutnya: {nextSession.topic}
                    </p>
                    <p className="text-[13px] text-[#5B687A] mt-0.5 tabular-nums">
                      {nextSession.date} · {myClass.scheduleTime} · {myClass.room}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => navigate('classes')}>
                    Lihat Jadwal
                  </Button>
                </div>
              )}

              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium text-[#0D1B2A]">
                    Pelajari Materi Pembinaan Sebelum Pertemuan
                  </p>
                  <p className="text-[13px] text-[#5B687A] mt-0.5">
                    Tandai materi yang sudah dibaca untuk memantau persiapan iman Anda.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate('materials')}>
                  Baca Materi
                </Button>
              </div>
            </div>
          </section>

          <section className="bg-white border border-[#E2E7EF] rounded-[10px] p-5 sm:p-6">
            <h2 className="text-[18px] font-semibold text-[#0D1B2A]">Akses Cepat</h2>
            <p className="text-[13px] text-[#5B687A] mt-0.5">
              Pintasan menuju informasi pembinaan Anda.
            </p>
            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => navigate('classes')}
                className="w-full px-3.5 py-3 rounded-[8px] border border-[#E2E7EF] hover:border-[#CBD4E1] hover:bg-[#F8F9FB] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5 text-[14px] font-medium text-[#0D1B2A]">
                  <CalendarDays className="w-4 h-4 text-[#082340]" />
                  Jadwal Kelas Saya
                </span>
                <ArrowRight className="w-4 h-4 text-[#69778A]" />
              </button>
              <button
                type="button"
                onClick={() => navigate('materials')}
                className="w-full px-3.5 py-3 rounded-[8px] border border-[#E2E7EF] hover:border-[#CBD4E1] hover:bg-[#F8F9FB] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5 text-[14px] font-medium text-[#0D1B2A]">
                  <BookOpen className="w-4 h-4 text-[#082340]" />
                  Materi & Panduan Doa
                </span>
                <ArrowRight className="w-4 h-4 text-[#69778A]" />
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EEF1F6]">
              <p className="text-[12px] font-medium text-[#5B687A]">Katekis Pendamping Anda</p>
              <p className="text-[14px] font-semibold text-[#0D1B2A] mt-1">
                {myClass?.catechistName || settings.coordinatorName}
              </p>
              <p className="text-[12px] text-[#5B687A] mt-0.5">
                Sekretariat: {settings.contactPhone}
              </p>
            </div>
          </section>
        </div>

        {/* SECTION D — REAL PERSONAL DOCUMENT UPLOAD PANEL */}
        {myRecord && (
          <section className="bg-white border border-[#E2E7EF] rounded-[10px] p-5 sm:p-6">
            <h2 className="text-[18px] font-semibold text-[#0D1B2A]">
              Unggah & Kelengkapan Berkas Saya
            </h2>
            <p className="text-[13px] text-[#5B687A] mt-0.5 mb-4">
              Unggah foto atau salinan PDF berkas persyaratan Anda (JPG, PNG, WebP, atau PDF) agar
              dapat langsung diverifikasi oleh Sekretariat dan Pastor Paroki.
            </p>
            <ParticipantDocumentsPanel participant={myRecord} canUpload={true} />
          </section>
        )}

        {myRecord && (
          <CertificatePreviewModal
            participant={showMyCertificate ? myRecord : null}
            catechesisClass={myClass}
            settings={settings}
            onClose={() => setShowMyCertificate(false)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // ADMIN, OPERATIONAL & APPROVER ROLE-ADAPTED DASHBOARDS
  // =========================================================================
  const overviewConfig = {
    admin: {
      heading: `Selamat datang, ${firstName}`,
      description: `Ringkasan operasional katekese, status persetujuan sakramen, dan kesiapan pembinaan di ${settings.parishName}.`,
      ctaLabel: 'Daftarkan Peserta',
      ctaAction: () => openRegistrationWizard(),
      ctaIcon: <Plus className="w-4 h-4" />,
    },
    operational: {
      heading: `Selamat bertugas, ${firstName}`,
      description:
        'Pantau daftar hadir kelas minggu ini, pendaftaran peserta baru, dan tindak lanjut berkas yang perlu dilengkapi.',
      ctaLabel: 'Daftarkan Peserta',
      ctaAction: () => openRegistrationWizard(),
      ctaIcon: <Plus className="w-4 h-4" />,
    },
    approver: {
      heading: `Selamat datang, ${signedInName}`,
      description:
        'Tinjau pengajuan kelayakan calon penerima sakramen, periksa kelengkapan berkas, dan pantau kesiapan paroki.',
      ctaLabel: `Tinjau Persetujuan (${pendingApprovals.length})`,
      ctaAction: () => navigate('approvals'),
      ctaIcon: <ClipboardCheck className="w-4 h-4" />,
    },
  }[role];

  const kpis =
    role === 'approver'
      ? [
          {
            label: 'Menunggu Persetujuan',
            value: String(pendingApprovals.length),
            sub: 'Perlu keputusan Pastor Paroki',
            accent: pendingApprovals.length > 0 ? 'text-[#A65E00]' : 'text-[#082340]',
          },
          {
            label: 'Siap Menerima Sakramen',
            value: String(readyForSacrament.length),
            sub: 'Telah diverifikasi & disetujui',
            accent: 'text-[#157347]',
          },
          {
            label: 'Perlu Revisi Berkas',
            value: String(revisionParticipants.length),
            sub: 'Dikembalikan ke katekis',
            accent: 'text-[#B42318]',
          },
          {
            label: 'Rata-rata Kehadiran',
            value: `${avgAttendance}%`,
            sub: `Target minimal ${settings.minimumAttendancePercent}%`,
            accent: 'text-[#082340]',
          },
        ]
      : role === 'operational'
        ? [
            {
              label: 'Peserta Aktif',
              value: String(activeParticipants.length),
              sub: `Dari total ${participants.length} terdaftar`,
              accent: 'text-[#082340]',
            },
            {
              label: 'Kelas Minggu Ini',
              value: String(upcomingSessions.length),
              sub: 'Pertemuan perlu pengisian absensi',
              accent: 'text-[#082340]',
            },
            {
              label: 'Berkas Perlu Revisi',
              value: String(revisionParticipants.length),
              sub: 'Perlu tindak lanjut katekis',
              accent: 'text-[#B42318]',
            },
            {
              label: 'Rata-rata Kehadiran',
              value: `${avgAttendance}%`,
              sub: `Dari ${classes.length} kelas aktif`,
              accent: 'text-[#157347]',
            },
          ]
        : [
            {
              label: 'Total Peserta Katekese',
              value: String(participants.length),
              sub: `${readyForSacrament.length} siap menerima sakramen`,
              accent: 'text-[#082340]',
            },
            {
              label: 'Menunggu Persetujuan',
              value: String(pendingApprovals.length),
              sub: 'Antrean verifikasi Pastor Paroki',
              accent: 'text-[#A65E00]',
            },
            {
              label: 'Rata-rata Kehadiran',
              value: `${avgAttendance}%`,
              sub: `${classes.length} kelas pembinaan aktif`,
              accent: 'text-[#157347]',
            },
            {
              label: 'Pengguna Aktif Sistem',
              value: String(users.filter((u) => u.active).length),
              sub: `Dari ${users.length} akun terdaftar`,
              accent: 'text-[#082340]',
            },
          ];

  return (
    <div className="space-y-8">
      {/* SECTION A — PAGE OVERVIEW */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] sm:text-[26px] font-bold tracking-tight text-[#0D1B2A]">
            {overviewConfig.heading}
          </h1>
          <p className="mt-1 text-[14px] text-[#4D5B6D] max-w-2xl">
            {overviewConfig.description}
          </p>
        </div>
        <Button
          variant="primary"
          icon={overviewConfig.ctaIcon}
          onClick={overviewConfig.ctaAction}
        >
          {overviewConfig.ctaLabel}
        </Button>
      </section>

      {/* SECTION B — KEY INFORMATION */}
      <section
        aria-label="Ringkasan statistik utama"
        className="bg-white border border-[#E2E7EF] rounded-[10px] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EEF1F6]"
      >
        {kpis.map((kpi) => (
          <div key={kpi.label} className="p-5">
            <p className="text-[13px] text-[#5B687A]">{kpi.label}</p>
            <p className={`mt-1.5 text-[28px] font-bold font-mono-num tracking-tight ${kpi.accent}`}>
              {kpi.value}
            </p>
            <p className="mt-1 text-[12px] text-[#5B687A]">{kpi.sub}</p>
          </div>
        ))}
      </section>

      {/* SECTION C — ACTION REQUIRED & SECTION E — QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-[#E2E7EF] rounded-[10px] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-semibold text-[#0D1B2A]">Perlu Tindakan</h2>
              <p className="text-[13px] text-[#5B687A] mt-0.5">
                {role === 'approver'
                  ? 'Daftar pengajuan sakramen yang menunggu keputusan Anda.'
                  : 'Tugas prioritas yang membutuhkan tindak lanjut segera.'}
              </p>
            </div>
            {hasPermission(role, 'view_approvals') && (
              <button
                type="button"
                onClick={() => navigate('approvals')}
                className="text-[13px] font-medium text-[#082340] hover:underline whitespace-nowrap cursor-pointer"
              >
                Lihat semua
              </button>
            )}
          </div>

          <div className="mt-4 divide-y divide-[#EEF1F6]">
            {role === 'approver' || role === 'admin' ? (
              pendingApprovals.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[#0D1B2A] truncate">
                      {item.participantName}
                    </p>
                    <p className="text-[12px] text-[#5B687A] mt-0.5">
                      {item.requestType} · {item.program} · {item.attendanceSummary}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => navigate('approvals')}>
                    Tinjau
                  </Button>
                </div>
              ))
            ) : (
              <>
                {unsubmittedVerifications.slice(0, 2).map((p) => (
                  <div
                    key={`new-${p.id}`}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#0D1B2A] truncate">
                        Pendaftaran Baru: {p.fullName}
                      </p>
                      <p className="text-[12px] text-[#5B687A] mt-0.5 truncate">
                        {p.program} · Lingkungan {p.lingkungan} · Perlu diperiksa & diajukan ke Pastor
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => jumpToParticipantDetail(p.id)}
                    >
                      Periksa & Ajukan
                    </Button>
                  </div>
                ))}
                {upcomingSessions.slice(0, 2).map((ses) => (
                  <div
                    key={ses.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#0D1B2A] truncate">
                        Isi Daftar Hadir: {ses.className}
                      </p>
                      <p className="text-[12px] text-[#5B687A] mt-0.5 tabular-nums">
                        {ses.date} · {ses.time} · Topik: {ses.topic}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => navigate('classes')}>
                      Catat Hadir
                    </Button>
                  </div>
                ))}
                {revisionParticipants.slice(0, 2).map((p) => (
                  <div
                    key={p.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#0D1B2A] truncate">
                        Lengkapi & Ajukan Ulang: {p.fullName}
                      </p>
                      <p className="text-[12px] text-[#5B687A] mt-0.5 truncate">
                        {p.notes || 'Berkas pendaftaran memerlukan perbaikan.'}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => jumpToParticipantDetail(p.id)}
                    >
                      Periksa
                    </Button>
                  </div>
                ))}
                {unsubmittedVerifications.length === 0 &&
                  upcomingSessions.length === 0 &&
                  revisionParticipants.length === 0 && (
                    <div className="py-6 flex items-center gap-2.5 text-[14px] text-[#157347]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Semua tugas operasional hari ini telah tertangani.</span>
                    </div>
                  )}
              </>
            )}

            {(role === 'approver' || role === 'admin') && pendingApprovals.length === 0 && (
              <div className="py-6 flex items-center gap-2.5 text-[14px] text-[#157347]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Semua antrean persetujuan telah diproses.</span>
              </div>
            )}
          </div>
        </section>

        {/* SECTION E — QUICK ACTIONS */}
        <section className="bg-white border border-[#E2E7EF] rounded-[10px] p-5 sm:p-6">
          <h2 className="text-[18px] font-semibold text-[#0D1B2A]">Aksi Cepat</h2>
          <p className="text-[13px] text-[#5B687A] mt-0.5">
            Pintasan untuk pekerjaan rutin peran Anda.
          </p>

          <div className="mt-4 space-y-2.5">
            {hasPermission(role, 'create_participant') && (
              <button
                type="button"
                onClick={() => openRegistrationWizard()}
                className="w-full px-3.5 py-3 rounded-[8px] border border-[#E2E7EF] hover:border-[#CBD4E1] hover:bg-[#F8F9FB] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5 text-[14px] font-medium text-[#0D1B2A]">
                  <UserPlus className="w-4 h-4 text-[#082340]" />
                  Daftarkan Peserta Baru
                </span>
                <ArrowRight className="w-4 h-4 text-[#69778A]" />
              </button>
            )}

            {hasPermission(role, 'decide_approvals') && (
              <button
                type="button"
                onClick={() => navigate('approvals')}
                className="w-full px-3.5 py-3 rounded-[8px] border border-[#E2E7EF] hover:border-[#CBD4E1] hover:bg-[#F8F9FB] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5 text-[14px] font-medium text-[#0D1B2A]">
                  <FileCheck2 className="w-4 h-4 text-[#082340]" />
                  Buka Antrean Persetujuan
                </span>
                <ArrowRight className="w-4 h-4 text-[#69778A]" />
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('classes')}
              className="w-full px-3.5 py-3 rounded-[8px] border border-[#E2E7EF] hover:border-[#CBD4E1] hover:bg-[#F8F9FB] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5 text-[14px] font-medium text-[#0D1B2A]">
                <CalendarDays className="w-4 h-4 text-[#082340]" />
                {hasPermission(role, 'record_attendance')
                  ? 'Kelola Jadwal & Daftar Hadir'
                  : 'Lihat Jadwal Kelas Paroki'}
              </span>
              <ArrowRight className="w-4 h-4 text-[#69778A]" />
            </button>

            <button
              type="button"
              onClick={() => navigate('reports')}
              className="w-full px-3.5 py-3 rounded-[8px] border border-[#E2E7EF] hover:border-[#CBD4E1] hover:bg-[#F8F9FB] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5 text-[14px] font-medium text-[#0D1B2A]">
                <Users className="w-4 h-4 text-[#082340]" />
                Laporan & Cetak Surat PDF
              </span>
              <ArrowRight className="w-4 h-4 text-[#69778A]" />
            </button>

            {(hasPermission(role, 'manage_settings') || hasPermission(role, 'manage_cms')) && (
              <button
                type="button"
                onClick={() => navigate(hasPermission(role, 'manage_settings') ? 'settings' : 'cms')}
                className="w-full px-3.5 py-3 rounded-[8px] border border-[#E2E7EF] hover:border-[#CBD4E1] hover:bg-[#F8F9FB] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5 text-[14px] font-medium text-[#0D1B2A]">
                  <Settings className="w-4 h-4 text-[#082340]" />
                  Pengaturan Paroki & CMS Website
                </span>
                <ArrowRight className="w-4 h-4 text-[#69778A]" />
              </button>
            )}
          </div>
        </section>
      </div>

      {/* SECTION D — RECENT ACTIVITIES */}
      <section className="bg-white border border-[#E2E7EF] rounded-[10px] overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-[#E2E7EF] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-semibold text-[#0D1B2A]">Aktivitas Peserta Terbaru</h2>
            <p className="text-[13px] text-[#5B687A] mt-0.5">
              Perkembangan pendaftaran dan status kesiapan sakramen terkini.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('participants')}
            className="text-[13px] font-medium text-[#082340] hover:underline whitespace-nowrap cursor-pointer"
          >
            Semua peserta
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E7EF] bg-[#FAFBFC] text-[12px] font-medium text-[#5B687A]">
                <th className="py-3 px-5">Peserta</th>
                <th className="py-3 px-4">Program Sakramen</th>
                <th className="py-3 px-4 hidden md:table-cell">Lingkungan</th>
                <th className="py-3 px-4 text-right hidden sm:table-cell">Kehadiran</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1F6] text-[14px]">
              {participants.slice(0, 6).map((p) => (
                <tr
                  key={p.id}
                  onClick={() => jumpToParticipantDetail(p.id)}
                  className="hover:bg-[#F8F9FB] transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-5">
                    <div className="font-medium text-[#0D1B2A]">{p.fullName}</div>
                    <div className="text-[12px] font-mono-num text-[#69778A]">{p.code}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[#334155] text-[13px]">{p.program}</td>
                  <td className="py-3.5 px-4 text-[#4D5B6D] text-[13px] hidden md:table-cell">
                    {p.lingkungan}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-num text-[13px] text-[#0D1B2A] hidden sm:table-cell">
                    {p.attendanceCount}/{p.totalSessions}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <StatusIndicator status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
