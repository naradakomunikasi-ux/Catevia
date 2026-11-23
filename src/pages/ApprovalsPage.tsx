import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileBadge2, FileText, History, RotateCcw, XCircle } from 'lucide-react';
import { ApprovalRequest, ApprovalStatus } from '../types/catevia';
import { hasPermission } from '../data/permissions';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { EmptyState } from '../components/ui/EmptyState';
import { Textarea } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/Modal';
import { ParticipantDocumentsPanel } from '../components/documents/ParticipantDocumentsPanel';
import { CertificatePreviewModal } from '../components/certificates/CertificatePreviewModal';

export const ApprovalsPage: React.FC = () => {
  const { role, approvals, participants, classes, settings, decideApproval } = useApp();
  const canDecide = hasPermission(role, 'decide_approvals');

  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [selectedId, setSelectedId] = useState<string>(
    approvals.find((a) => a.status === 'Menunggu')?.id || approvals[0]?.id || ''
  );
  const [decisionNote, setDecisionNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const list = useMemo(() => {
    return tab === 'pending'
      ? approvals.filter((a) => a.status === 'Menunggu')
      : approvals.filter((a) => a.status !== 'Menunggu');
  }, [approvals, tab]);

  const selected: ApprovalRequest | undefined =
    list.find((item) => item.id === selectedId) || list[0];

  const linkedParticipant = selected
    ? participants.find((p) => p.id === selected.participantId)
    : undefined;

  const liveDocsComplete = linkedParticipant
    ? linkedParticipant.documents.ktpKk &&
      linkedParticipant.documents.suratBaptisAtauRekomendasi &&
      linkedParticipant.documents.pasFoto
    : Boolean(selected?.documentsComplete);

  const liveAttendancePct = linkedParticipant
    ? Math.round(
        (linkedParticipant.attendanceCount / Math.max(1, linkedParticipant.totalSessions)) * 100
      )
    : null;
  const meetsAttendanceRequirement =
    liveAttendancePct === null ? true : liveAttendancePct >= settings.minimumAttendancePercent;
  const liveAttendanceLabel = linkedParticipant
    ? `${linkedParticipant.attendanceCount} dari ${linkedParticipant.totalSessions} pertemuan (${liveAttendancePct}%)`
    : selected?.attendanceSummary || '-';

  const pendingCount = approvals.filter((a) => a.status === 'Menunggu').length;
  const historyCount = approvals.length - pendingCount;

  const handleDecision = async (decision: Exclude<ApprovalStatus, 'Menunggu'>) => {
    if (!selected || submittingDecision) return;
    if ((decision === 'Perlu Revisi' || decision === 'Ditolak') && !decisionNote.trim()) {
      setNoteError('Tuliskan alasan atau instruksi perbaikan agar katekis dapat menindaklanjuti.');
      return;
    }

    if (decision === 'Ditolak') {
      setConfirmRejectOpen(true);
      return;
    }

    const finalNote =
      decisionNote.trim() ||
      (decision === 'Disetujui'
        ? 'Memenuhi seluruh syarat kehadiran dan kelengkapan berkas sakramen.'
        : '');

    setSubmittingDecision(true);
    try {
      await decideApproval(selected.id, decision, finalNote);
      setDecisionNote('');
      setNoteError('');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const executeReject = async () => {
    if (!selected || submittingDecision) return;
    setSubmittingDecision(true);
    try {
      await decideApproval(selected.id, 'Ditolak', decisionNote.trim());
      setDecisionNote('');
      setNoteError('');
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[#0D1B2A]">
          Antrean Persetujuan
        </h1>
        <p className="mt-1 text-[14px] text-[#4D5B6D]">
          Tinjau salinan berkas terunggah, kehadiran pertemuan, dan kelayakan calon penerima sakramen.
        </p>
      </div>

      {/* Queue Tabs */}
      <div
        role="tablist"
        aria-label="Filter antrean persetujuan"
        className="inline-flex items-center gap-1 p-1 bg-[#EEF1F6] rounded-[9px]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'pending'}
          onClick={() => setTab('pending')}
          className={`min-h-[36px] px-4 py-1.5 rounded-[7px] text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
            tab === 'pending'
              ? 'bg-white text-[#082340] shadow-[0_1px_2px_rgba(8,35,64,0.08)]'
              : 'text-[#4D5B6D] hover:text-[#0D1B2A]'
          }`}
        >
          Menunggu Keputusan{' '}
          <span className="ml-1 font-mono-num text-[#A65E00]">{pendingCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'history'}
          onClick={() => setTab('history')}
          className={`min-h-[36px] px-4 py-1.5 rounded-[7px] text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
            tab === 'history'
              ? 'bg-white text-[#082340] shadow-[0_1px_2px_rgba(8,35,64,0.08)]'
              : 'text-[#4D5B6D] hover:text-[#0D1B2A]'
          }`}
        >
          Riwayat Keputusan{' '}
          <span className="ml-1 font-mono-num text-[#5B687A]">{historyCount}</span>
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={
            tab === 'pending'
              ? 'Tidak ada pengajuan yang menunggu'
              : 'Belum ada riwayat keputusan'
          }
          description={
            tab === 'pending'
              ? 'Seluruh pengajuan verifikasi berkas dan kelayakan sakramen telah selesai diproses.'
              : 'Keputusan persetujuan yang telah Anda proses akan tercatat secara kronologis di sini.'
          }
          actionLabel={tab === 'pending' ? 'Lihat Riwayat Keputusan' : 'Kembali ke Antrean'}
          onAction={() => setTab(tab === 'pending' ? 'history' : 'pending')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Queue List */}
          <div className="lg:col-span-5 bg-white border border-[#E2E7EF] rounded-[10px] divide-y divide-[#EEF1F6] overflow-hidden">
            {list.map((item) => {
              const isSelected = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setDecisionNote('');
                    setNoteError('');
                  }}
                  className={`w-full text-left p-4 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#EDF2F7]/75' : 'hover:bg-[#F8F9FB]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-mono-num text-[#5B687A]">{item.code}</span>
                    <StatusIndicator status={item.status} />
                  </div>
                  <p className="mt-1.5 text-[15px] font-semibold text-[#0D1B2A]">
                    {item.participantName}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#4D5B6D]">
                    {item.requestType} · {item.program}
                  </p>
                  <p className="mt-1.5 text-[12px] text-[#69778A]">
                    Diajukan oleh {item.submittedBy} ·{' '}
                    <span className="font-mono-num">{item.submittedAt}</span>
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detail & Decision Panel */}
          {selected && (
            <div className="lg:col-span-7 bg-white border border-[#E2E7EF] rounded-[10px] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E2E7EF] flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-mono-num text-[#5B687A]">
                    {selected.code} · {selected.requestType}
                  </p>
                  <h2 className="mt-1 text-[20px] font-bold text-[#0D1B2A]">
                    {selected.participantName}
                  </h2>
                  <p className="text-[13px] text-[#4D5B6D] mt-0.5">
                    {selected.program} · Lingkungan {selected.lingkungan}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusIndicator status={selected.status} />
                  {selected.status === 'Disetujui' && linkedParticipant && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<FileBadge2 className="w-4 h-4" />}
                      onClick={() => setShowCertModal(true)}
                    >
                      Cetak Surat PDF
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Key Verification Facts */}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-[#EEF1F6] text-[14px]">
                  <div>
                    <dt className="text-[12px] text-[#5B687A]">Kehadiran Katekese (Terkini)</dt>
                    <dd className="mt-0.5 font-medium font-mono-num text-[#0D1B2A]">
                      {liveAttendanceLabel}
                    </dd>
                    {liveAttendancePct !== null && (
                      <p
                        className={`mt-0.5 text-[12px] ${
                          meetsAttendanceRequirement ? 'text-[#157347]' : 'text-[#A65E00]'
                        }`}
                      >
                        {meetsAttendanceRequirement
                          ? `Memenuhi syarat minimal ${settings.minimumAttendancePercent}%`
                          : `Belum mencapai syarat minimal ${settings.minimumAttendancePercent}%`}
                      </p>
                    )}
                  </div>
                  <div>
                    <dt className="text-[12px] text-[#5B687A]">Kelengkapan Berkas</dt>
                    <dd className="mt-0.5">
                      <StatusIndicator
                        status={liveDocsComplete ? 'Lengkap' : 'Belum Lengkap'}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12px] text-[#5B687A]">Diajukan Oleh</dt>
                    <dd className="mt-0.5 text-[#0D1B2A]">{selected.submittedBy}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] text-[#5B687A]">Wali / Orang Tua</dt>
                    <dd className="mt-0.5 text-[#0D1B2A]">
                      {linkedParticipant?.sponsorName || '-'}
                    </dd>
                  </div>
                </dl>

                {/* Document Summary & Live Preview Panel */}
                <div>
                  <h3 className="text-[14px] font-semibold text-[#0D1B2A] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#5B687A]" />
                    <span>Ringkasan Pengajuan & Pratinjau Berkas</span>
                  </h3>
                  <p className="mt-2 mb-3 text-[14px] text-[#334155] leading-relaxed">
                    {selected.summaryNote}
                  </p>

                  {linkedParticipant && (
                    <ParticipantDocumentsPanel
                      participant={linkedParticipant}
                      canUpload={role === 'admin'}
                      compact
                    />
                  )}
                </div>

                {/* Decision Form for Pending Requests */}
                {selected.status === 'Menunggu' && canDecide && (
                  <div className="pt-5 border-t border-[#EEF1F6] space-y-4">
                    {selected.requestType === 'Kelayakan Penerimaan Sakramen' &&
                      (!meetsAttendanceRequirement || !liveDocsComplete) && (
                        <div className="px-3.5 py-2.5 rounded-[8px] bg-[#FBF6EC] border border-[#E5CFA6] text-[13px] text-[#6B4A14]">
                          Catatan kesiapan:{' '}
                          {!meetsAttendanceRequirement
                            ? `kehadiran (${liveAttendancePct}%) masih di bawah batas minimal ${settings.minimumAttendancePercent}%`
                            : ''}
                          {!meetsAttendanceRequirement && !liveDocsComplete ? ' dan ' : ''}
                          {!liveDocsComplete ? 'kelengkapan berkas belum seluruhnya tercentang' : ''}.
                        </div>
                      )}

                    <p className="text-[12px] text-[#5B687A]">
                      Dampak keputusan:{' '}
                      <span className="font-medium text-[#0D1B2A]">
                        Setujui →{' '}
                        {selected.requestType === 'Kelayakan Penerimaan Sakramen'
                          ? 'Siap Sakramen'
                          : 'Aktif'}
                      </span>{' '}
                      · Minta Revisi / Tolak →{' '}
                      <span className="font-medium text-[#0D1B2A]">Perlu Revisi</span>
                    </p>

                    <Textarea
                      label="Catatan Keputusan / Arahan Pastoral"
                      value={decisionNote}
                      onChange={(e) => {
                        setDecisionNote(e.target.value);
                        if (noteError) setNoteError('');
                      }}
                      placeholder="Tuliskan catatan persetujuan atau instruksi revisi untuk katekis..."
                      hint="Wajib diisi apabila memilih Minta Revisi atau Tolak."
                      error={noteError}
                    />

                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button
                        variant="primary"
                        loading={submittingDecision}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        onClick={() => void handleDecision('Disetujui')}
                      >
                        Setujui Pengajuan
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={submittingDecision}
                        icon={<RotateCcw className="w-4 h-4" />}
                        onClick={() => void handleDecision('Perlu Revisi')}
                      >
                        Minta Revisi
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={submittingDecision}
                        icon={<XCircle className="w-4 h-4" />}
                        onClick={() => void handleDecision('Ditolak')}
                        className="text-[#B42318] hover:bg-[#FEF2F2] hover:text-[#912018]"
                      >
                        Tolak
                      </Button>
                    </div>
                  </div>
                )}

                {/* Approval Audit Trail */}
                <div className="pt-5 border-t border-[#EEF1F6]">
                  <h3 className="text-[14px] font-semibold text-[#0D1B2A] flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-[#5B687A]" />
                    <span>Riwayat Tinjauan</span>
                  </h3>
                  <ol className="space-y-3">
                    {selected.history.map((h) => (
                      <li
                        key={h.id}
                        className="p-3.5 rounded-[8px] bg-[#F8F9FB] border border-[#EEF1F6] text-[13px]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-[#0D1B2A]">
                            {h.action} · {h.actorName}
                          </span>
                          <span className="text-[12px] font-mono-num text-[#69778A]">{h.date}</span>
                        </div>
                        <p className="text-[12px] text-[#5B687A]">{h.actorRole}</p>
                        <p className="mt-1.5 text-[#334155] leading-relaxed">{h.note}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {linkedParticipant && (
        <CertificatePreviewModal
          participant={showCertModal ? linkedParticipant : null}
          catechesisClass={classes.find((c) => c.id === linkedParticipant.classId)}
          approval={selected}
          settings={settings}
          onClose={() => setShowCertModal(false)}
        />
      )}

      <ConfirmDialog
        open={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        onConfirm={() => void executeReject()}
        title="Tolak Pengajuan Sakramen?"
        description="Pengajuan akan ditandai Ditolak dan catatan Anda akan diteruskan ke katekis pendamping. Pastikan alasan penolakan sudah jelas."
        confirmLabel="Ya, Tolak Pengajuan"
      />
    </div>
  );
};
