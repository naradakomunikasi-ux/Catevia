import React, { useMemo, useState } from 'react';
import { Download, FileBadge2 } from 'lucide-react';
import { Participant, ProgramType } from '../types/catevia';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { CertificatePreviewModal } from '../components/certificates/CertificatePreviewModal';
import { downloadSafeCsv } from '../utils/csvExport';

const PROGRAMS: ProgramType[] = [
  'Katekumen (Baptis Dewasa)',
  'Komuni Pertama',
  'Krisma (Penguatan)',
];

export const ReportsPage: React.FC = () => {
  const { participants, classes, approvals, settings, showToast } = useApp();
  const [certParticipant, setCertParticipant] = useState<Participant | null>(null);

  const programBreakdown = useMemo(() => {
    return PROGRAMS.map((prog) => {
      const items = participants.filter((p) => p.program === prog);
      const ready = items.filter((p) => p.status === 'Siap Sakramen' || p.status === 'Selesai').length;
      const pending = items.filter((p) => p.status === 'Menunggu Verifikasi').length;
      const revision = items.filter((p) => p.status === 'Perlu Revisi').length;
      const avgAttend = items.length
        ? Math.round(
            (items.reduce((acc, p) => acc + p.attendanceCount / Math.max(1, p.totalSessions), 0) /
              items.length) *
              100
          )
        : 0;
      const docsComplete = items.filter(
        (p) => p.documents.ktpKk && p.documents.suratBaptisAtauRekomendasi && p.documents.pasFoto
      ).length;

      return {
        program: prog,
        total: items.length,
        ready,
        pending,
        revision,
        avgAttend,
        docsComplete,
      };
    });
  }, [participants]);

  const lingkunganSummary = useMemo(() => {
    const map = new Map<string, { total: number; ready: number; revision: number }>();
    participants.forEach((p) => {
      const curr = map.get(p.lingkungan) || { total: 0, ready: 0, revision: 0 };
      curr.total += 1;
      if (p.status === 'Siap Sakramen' || p.status === 'Selesai') curr.ready += 1;
      if (p.status === 'Perlu Revisi') curr.revision += 1;
      map.set(p.lingkungan, curr);
    });
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total);
  }, [participants]);

  const certificateReadyParticipants = useMemo(
    () => participants.filter((p) => p.status === 'Siap Sakramen' || p.status === 'Selesai'),
    [participants]
  );

  const totalDocsComplete = participants.filter(
    (p) => p.documents.ktpKk && p.documents.suratBaptisAtauRekomendasi && p.documents.pasFoto
  ).length;

  const approvedCount = approvals.filter((a) => a.status === 'Disetujui').length;

  const handleDownloadReport = () => {
    const header = [
      'Program Sakramen',
      'Total Peserta',
      'Siap/Selesai',
      'Menunggu Verifikasi',
      'Perlu Revisi',
      'Berkas Lengkap',
      'Rata-rata Kehadiran (%)',
    ];
    const rows = programBreakdown.map((r) => [
      r.program,
      r.total,
      r.ready,
      r.pending,
      r.revision,
      r.docsComplete,
      `${r.avgAttend}%`,
    ]);
    downloadSafeCsv(
      `laporan-katekese-${new Date().toISOString().slice(0, 10)}.csv`,
      header,
      rows
    );
    showToast({
      type: 'success',
      title: 'Laporan CSV berhasil diunduh',
      description: 'Rekapitulasi katekese paroki siap dicetak atau dibagikan.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-[#0D1B2A]">
            Laporan & Analitik Paroki
          </h1>
          <p className="mt-1 text-[14px] text-[#4D5B6D]">
            Rekapitulasi kesiapan penerimaan sakramen dan penerbitan Surat Keterangan PDF untuk{' '}
            {settings.parishName} ({settings.academicYear}).
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Download className="w-4 h-4" />}
          onClick={handleDownloadReport}
        >
          Unduh Rekapitulasi (CSV)
        </Button>
      </div>

      {/* Decision Summary Strip */}
      <div className="bg-white border border-[#E2E7EF] rounded-[10px] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#EEF1F6]">
        <div className="p-5">
          <p className="text-[13px] text-[#5B687A]">Kelengkapan Berkas Paroki</p>
          <p className="mt-1.5 text-[26px] font-bold font-mono-num text-[#082340]">
            {totalDocsComplete}/{participants.length}
          </p>
          <p className="mt-1 text-[12px] text-[#5B687A]">
            {Math.round((totalDocsComplete / Math.max(1, participants.length)) * 100)}% peserta telah
            melengkapi seluruh dokumen
          </p>
        </div>
        <div className="p-5">
          <p className="text-[13px] text-[#5B687A]">Pengajuan Disetujui Pastor</p>
          <p className="mt-1.5 text-[26px] font-bold font-mono-num text-[#157347]">
            {approvedCount}
          </p>
          <p className="mt-1 text-[12px] text-[#5B687A]">
            Dari {approvals.length} total pengajuan verifikasi periode ini
          </p>
        </div>
        <div className="p-5">
          <p className="text-[13px] text-[#5B687A]">Siap Cetak Surat Keterangan</p>
          <p className="mt-1.5 text-[26px] font-bold font-mono-num text-[#082340]">
            {certificateReadyParticipants.length}
          </p>
          <p className="mt-1 text-[12px] text-[#5B687A]">
            Peserta berstatus Siap Sakramen / Selesai
          </p>
        </div>
      </div>

      {/* Official Sacrament Readiness Certificates Table */}
      <section className="bg-white border border-[#E2E7EF] rounded-[10px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E7EF]">
          <h2 className="text-[18px] font-semibold text-[#0D1B2A]">
            Penerbitan Surat Keterangan Kesiapan Sakramen (PDF)
          </h2>
          <p className="text-[13px] text-[#5B687A] mt-0.5">
            Daftar peserta yang telah disetujui dan siap dicetakkan surat keterangan resmi Sekretariat Paroki.
          </p>
        </div>
        {certificateReadyParticipants.length === 0 ? (
          <p className="px-6 py-8 text-[14px] text-[#5B687A]">
            Belum ada peserta berstatus Siap Sakramen atau Selesai.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E7EF] bg-[#FAFBFC] text-[12px] font-medium text-[#5B687A]">
                  <th className="py-3 px-6">Peserta</th>
                  <th className="py-3 px-4">Program Sakramen</th>
                  <th className="py-3 px-4 hidden md:table-cell">Lingkungan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Surat Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1F6] text-[14px]">
                {certificateReadyParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8F9FB]">
                    <td className="py-3.5 px-6">
                      <div className="font-medium text-[#0D1B2A]">{p.fullName}</div>
                      <div className="text-[12px] font-mono-num text-[#69778A]">{p.code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-[#334155]">{p.program}</td>
                    <td className="py-3.5 px-4 text-[13px] text-[#4D5B6D] hidden md:table-cell">
                      Lingk. {p.lingkungan}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusIndicator status={p.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<FileBadge2 className="w-3.5 h-3.5" />}
                        onClick={() => setCertParticipant(p)}
                      >
                        Pratinjau & Unduh PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Program Readiness Table */}
      <section className="bg-white border border-[#E2E7EF] rounded-[10px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E7EF]">
          <h2 className="text-[18px] font-semibold text-[#0D1B2A]">
            Rekapitulasi per Program Sakramen
          </h2>
          <p className="text-[13px] text-[#5B687A] mt-0.5">
            Perbandingan jumlah peserta, tingkat kehadiran, dan kesiapan dokumen di setiap program.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E7EF] bg-[#FAFBFC] text-[12px] font-medium text-[#5B687A]">
                <th className="py-3 px-6">Program Sakramen</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Siap / Selesai</th>
                <th className="py-3 px-4 text-right">Menunggu</th>
                <th className="py-3 px-4 text-right">Perlu Revisi</th>
                <th className="py-3 px-4 text-right">Berkas Lengkap</th>
                <th className="py-3 px-6 text-right">Rata-rata Hadir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1F6] text-[14px]">
              {programBreakdown.map((row) => (
                <tr key={row.program} className="hover:bg-[#F8F9FB]">
                  <td className="py-4 px-6 font-medium text-[#0D1B2A]">{row.program}</td>
                  <td className="py-4 px-4 text-right font-mono-num text-[#0D1B2A]">{row.total}</td>
                  <td className="py-4 px-4 text-right font-mono-num text-[#157347] font-medium">
                    {row.ready}
                  </td>
                  <td className="py-4 px-4 text-right font-mono-num text-[#A65E00]">
                    {row.pending}
                  </td>
                  <td className="py-4 px-4 text-right font-mono-num text-[#B42318]">
                    {row.revision}
                  </td>
                  <td className="py-4 px-4 text-right font-mono-num text-[#4D5B6D]">
                    {row.docsComplete}/{row.total}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-24 h-2 bg-[#EEF1F6] rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-[#082340] rounded-full"
                          style={{ width: `${row.avgAttend}%` }}
                        />
                      </div>
                      <span className="font-mono-num text-[13px] font-semibold text-[#082340] w-10 text-right">
                        {row.avgAttend}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Lingkungan Distribution Table */}
      <section className="bg-white border border-[#E2E7EF] rounded-[10px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E7EF]">
          <h2 className="text-[18px] font-semibold text-[#0D1B2A]">
            Sebaran Peserta per Lingkungan
          </h2>
          <p className="text-[13px] text-[#5B687A] mt-0.5">
            Membantu koordinasi surat rekomendasi bersama para Ketua Lingkungan.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:gap-px bg-[#EEF1F6]">
          {lingkunganSummary.map((item) => (
            <div key={item.name} className="bg-white px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-medium text-[#0D1B2A]">Lingk. {item.name}</p>
                <p className="text-[12px] text-[#5B687A] mt-0.5 font-mono-num">
                  {item.ready} siap · {item.revision} revisi
                </p>
              </div>
              <span className="text-[18px] font-bold font-mono-num text-[#082340]">
                {item.total}
              </span>
            </div>
          ))}
        </div>
      </section>

      <CertificatePreviewModal
        participant={certParticipant}
        catechesisClass={classes.find((c) => c.id === certParticipant?.classId)}
        approval={approvals.find((a) => a.participantId === certParticipant?.id)}
        settings={settings}
        onClose={() => setCertParticipant(null)}
      />
    </div>
  );
};
