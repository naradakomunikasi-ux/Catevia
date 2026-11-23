import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Eye,
  FileBadge2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { ApprovalRequest, Participant, ParticipantStatus, ProgramType } from '../types/catevia';
import { hasPermission } from '../data/permissions';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { ConfirmDialog, Modal, SlideOverDrawer } from '../components/ui/Modal';
import { SelectField, Textarea } from '../components/ui/Input';
import { EmptyState, TableSkeleton } from '../components/ui/EmptyState';
import { ParticipantEditModal } from '../components/forms/ParticipantEditModal';
import { ParticipantDocumentsPanel } from '../components/documents/ParticipantDocumentsPanel';
import { CertificatePreviewModal } from '../components/certificates/CertificatePreviewModal';
import { downloadSafeCsv } from '../utils/csvExport';

type SortField = 'fullName' | 'program' | 'attendance' | 'registeredAt' | 'status';

const STATUS_TABS: ('Semua' | ParticipantStatus)[] = [
  'Semua',
  'Aktif',
  'Menunggu Verifikasi',
  'Perlu Revisi',
  'Siap Sakramen',
  'Selesai',
];

const PROGRAM_OPTIONS: ('Semua' | ProgramType)[] = [
  'Semua',
  'Katekumen (Baptis Dewasa)',
  'Komuni Pertama',
  'Krisma (Penguatan)',
];

export const ParticipantsPage: React.FC = () => {
  const {
    role,
    participants,
    classes,
    approvals,
    settings,
    isPageLoading,
    triggerPageRefresh,
    openRegistrationWizard,
    deleteParticipant,
    bulkUpdateParticipantStatus,
    bulkDeleteParticipants,
    submitApprovalRequest,
    selectedParticipantIdFromSearch,
    clearSelectedParticipantFromSearch,
    showToast,
  } = useApp();

  const canCreate = hasPermission(role, 'create_participant');
  const canEdit = hasPermission(role, 'edit_participant');
  const canDelete = hasPermission(role, 'delete_participant');
  const canBulk = hasPermission(role, 'bulk_manage_participants');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | ParticipantStatus>('Semua');
  const [programFilter, setProgramFilter] = useState<'Semua' | ProgramType>('Semua');
  const [sortField, setSortField] = useState<SortField>('registeredAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<ParticipantStatus>('Siap Sakramen');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [detailParticipantId, setDetailParticipantId] = useState<string | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [certificateParticipant, setCertificateParticipant] = useState<Participant | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const [approvalModalParticipant, setApprovalModalParticipant] = useState<Participant | null>(null);
  const [approvalRequestType, setApprovalRequestType] = useState<ApprovalRequest['requestType']>(
    'Kelayakan Penerimaan Sakramen'
  );
  const [approvalSummaryNote, setApprovalSummaryNote] = useState('');
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const detailParticipant = useMemo(
    () => participants.find((p) => p.id === detailParticipantId) || null,
    [participants, detailParticipantId]
  );

  const detailParticipantApprovals = useMemo(
    () =>
      detailParticipant ? approvals.filter((a) => a.participantId === detailParticipant.id) : [],
    [approvals, detailParticipant]
  );

  const detailHasPendingApproval = detailParticipantApprovals.some((a) => a.status === 'Menunggu');
  const detailLatestApproval = detailParticipantApprovals[0] || null;

  const openSubmitApprovalModal = (participant: Participant) => {
    const previousApproval = approvals.find((a) => a.participantId === participant.id);
    const defaultType: ApprovalRequest['requestType'] =
      participant.status === 'Menunggu Verifikasi'
        ? 'Verifikasi Berkas Pendaftaran'
        : participant.status === 'Perlu Revisi' && previousApproval
          ? previousApproval.requestType
          : 'Kelayakan Penerimaan Sakramen';
    setApprovalRequestType(defaultType);
    setApprovalSummaryNote(
      participant.status === 'Perlu Revisi'
        ? 'Berkas yang diminta telah dilengkapi dan diperbarui untuk ditinjau kembali.'
        : ''
    );
    setApprovalModalParticipant(participant);
  };

  const handleConfirmSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalModalParticipant || submittingApproval) return;
    setSubmittingApproval(true);
    try {
      await submitApprovalRequest(
        approvalModalParticipant.id,
        approvalRequestType,
        approvalSummaryNote
      );
      setApprovalModalParticipant(null);
      setApprovalSummaryNote('');
    } finally {
      setSubmittingApproval(false);
    }
  };

  useEffect(() => {
    if (!selectedParticipantIdFromSearch) return;
    if (participants.some((p) => p.id === selectedParticipantIdFromSearch)) {
      setDetailParticipantId(selectedParticipantIdFromSearch);
    }
    clearSelectedParticipantFromSearch();
  }, [selectedParticipantIdFromSearch, participants, clearSelectedParticipantFromSearch]);

  // Prune any selectedIds that were deleted from Firestore
  useEffect(() => {
    const validIds = new Set(participants.map((p) => p.id));
    setSelectedIds((prev) => {
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [participants]);

  useEffect(() => {
    if (!openMenuId) return;
    const onOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-row-menu]')) {
        setOpenMenuId(null);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [openMenuId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return participants
      .filter((p) => {
        if (statusFilter !== 'Semua' && p.status !== statusFilter) return false;
        if (programFilter !== 'Semua' && p.program !== programFilter) return false;
        if (!q) return true;
        return (
          p.fullName.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.lingkungan.toLowerCase().includes(q) ||
          p.sponsorName.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'fullName') cmp = a.fullName.localeCompare(b.fullName);
        else if (sortField === 'program') cmp = a.program.localeCompare(b.program);
        else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
        else if (sortField === 'registeredAt') cmp = a.registeredAt.localeCompare(b.registeredAt);
        else if (sortField === 'attendance') {
          cmp = a.attendanceCount / a.totalSessions - b.attendanceCount / b.totalSessions;
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [participants, search, statusFilter, programFilter, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const toggleSelectAllPage = () => {
    const pageIds = paginated.map((p) => p.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExportCsv = (rowsToExport: Participant[]) => {
    const header = ['Kode', 'Nama Lengkap', 'Program', 'Lingkungan', 'Kehadiran', 'Status', 'Tanggal Daftar'];
    const lines = rowsToExport.map((p) => [
      p.code,
      p.fullName,
      p.program,
      p.lingkungan,
      `${p.attendanceCount}/${p.totalSessions}`,
      p.status,
      p.registeredAt,
    ]);
    downloadSafeCsv(`catevia-peserta-${new Date().toISOString().slice(0, 10)}.csv`, header, lines);
    showToast({
      type: 'success',
      title: 'Ekspor CSV berhasil',
      description: `${rowsToExport.length} data peserta telah diunduh.`,
    });
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('Semua');
    setProgramFilter('Semua');
    setPage(1);
  };

  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.name || 'Belum ditentukan';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-[#0D1B2A]">
            Peserta & Pendaftaran
          </h1>
          <p className="mt-1 text-[14px] text-[#4D5B6D]">
            Kelola data calon penerima sakramen, kehadiran pertemuan, berkas digital, serta cetak surat kesiapan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={() => handleExportCsv(filtered)}
          >
            Ekspor CSV
          </Button>
          {canCreate && (
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => openRegistrationWizard()}
            >
              Daftarkan Peserta
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-[#E2E7EF] rounded-[10px] p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-[#69778A] absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama peserta, kode, lingkungan, atau wali..."
              aria-label="Cari peserta"
              className="w-full min-h-[40px] pl-9 pr-3 py-2 text-[14px] bg-[#F8F9FB] text-[#0D1B2A] placeholder:text-[#7D8A9C] rounded-[8px] border border-[#CBD4E1] focus:bg-white focus:border-[#082340]"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <select
              aria-label="Filter program sakramen"
              value={programFilter}
              onChange={(e) => {
                setProgramFilter(e.target.value as 'Semua' | ProgramType);
                setPage(1);
              }}
              className="min-h-[40px] px-3 py-2 text-[13px] bg-white text-[#0D1B2A] rounded-[8px] border border-[#CBD4E1] cursor-pointer"
            >
              {PROGRAM_OPTIONS.map((prog) => (
                <option key={prog} value={prog}>
                  {prog === 'Semua' ? 'Semua Program' : prog}
                </option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="md"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={triggerPageRefresh}
              aria-label="Muat ulang daftar"
            >
              Segarkan
            </Button>
          </div>
        </div>

        {/* Interactive Status Segmented Tabs */}
        <div
          role="tablist"
          aria-label="Filter berdasarkan status peserta"
          className="flex items-center gap-1 overflow-x-auto pb-0.5"
        >
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab;
            const count =
              tab === 'Semua'
                ? participants.length
                : participants.filter((p) => p.status === tab).length;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
                className={`min-h-[34px] px-3 py-1.5 rounded-[7px] text-[13px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#082340] text-white font-medium'
                    : 'text-[#4D5B6D] hover:bg-[#F2F4F8] hover:text-[#0D1B2A]'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`ml-1.5 font-mono-num text-[12px] ${
                    active ? 'text-[#E3BE7A]' : 'text-[#69778A]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Authorized Bulk Actions Bar */}
      {canBulk && selectedIds.length > 0 && (
        <div className="bg-[#EDF2F7] border border-[#CBD4E1] rounded-[10px] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[13px] font-medium text-[#082340]">
            <span className="font-mono-num font-semibold">{selectedIds.length}</span> peserta dipilih
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Pilih status massal"
              value={bulkStatusTarget}
              onChange={(e) => setBulkStatusTarget(e.target.value as ParticipantStatus)}
              className="min-h-[36px] px-2.5 py-1 text-[13px] bg-white border border-[#CBD4E1] rounded-[7px]"
            >
              <option value="Aktif">Aktif</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Siap Sakramen">Siap Sakramen</option>
              <option value="Selesai">Selesai</option>
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void bulkUpdateParticipantStatus(selectedIds, bulkStatusTarget);
                setSelectedIds([]);
              }}
            >
              Terapkan Status
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setConfirmBulkDelete(true)}
            >
              Hapus Terpilih
            </Button>
          </div>
        </div>
      )}

      {/* Table / Responsive Card Area */}
      {isPageLoading ? (
        <TableSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada peserta yang sesuai"
          description="Coba ubah kata kunci pencarian atau atur ulang filter program dan status."
          actionLabel="Atur Ulang Filter"
          onAction={resetFilters}
        />
      ) : (
        <>
          {/* Desktop Data Table */}
          <div className="hidden md:block bg-white border border-[#E2E7EF] rounded-[10px] overflow-visible">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E7EF] bg-[#FAFBFC] text-[12px] font-medium text-[#5B687A]">
                    {canBulk && (
                      <th className="py-3 pl-4 pr-2 w-10">
                        <input
                          type="checkbox"
                          aria-label="Pilih semua peserta di halaman ini"
                          checked={
                            paginated.length > 0 &&
                            paginated.every((p) => selectedIds.includes(p.id))
                          }
                          onChange={toggleSelectAllPage}
                          className="w-4 h-4 accent-[#082340] cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort('fullName')}
                        className="inline-flex items-center gap-1 hover:text-[#0D1B2A] cursor-pointer"
                      >
                        <span>Nama Peserta</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort('program')}
                        className="inline-flex items-center gap-1 hover:text-[#0D1B2A] cursor-pointer"
                      >
                        <span>Program & Lingkungan</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort('attendance')}
                        className="inline-flex items-center gap-1 hover:text-[#0D1B2A] cursor-pointer ml-auto"
                      >
                        <span>Kehadiran</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Berkas</th>
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort('status')}
                        className="inline-flex items-center gap-1 hover:text-[#0D1B2A] cursor-pointer"
                      >
                        <span>Status</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1F6] text-[14px]">
                  {paginated.map((p) => {
                    const docsCount = [
                      p.documents.ktpKk,
                      p.documents.suratBaptisAtauRekomendasi,
                      p.documents.pasFoto,
                    ].filter(Boolean).length;
                    const pct = Math.round((p.attendanceCount / Math.max(1, p.totalSessions)) * 100);
                    const isSelected = selectedIds.includes(p.id);

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-[#EDF2F7]/50' : 'hover:bg-[#F8F9FB]'
                        }`}
                      >
                        {canBulk && (
                          <td className="py-3.5 pl-4 pr-2">
                            <input
                              type="checkbox"
                              aria-label={`Pilih ${p.fullName}`}
                              checked={isSelected}
                              onChange={() => toggleSelectOne(p.id)}
                              className="w-4 h-4 accent-[#082340] cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => setDetailParticipantId(p.id)}
                            className="text-left group cursor-pointer"
                          >
                            <div className="font-medium text-[#0D1B2A] group-hover:text-[#082340] group-hover:underline">
                              {p.fullName}
                            </div>
                            <div className="text-[12px] font-mono-num text-[#69778A]">
                              {p.code} · {p.phone}
                            </div>
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-[13px] text-[#0D1B2A]">{p.program}</div>
                          <div className="text-[12px] text-[#5B687A]">Lingk. {p.lingkungan}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono-num text-[13px]">
                          <div className="text-[#0D1B2A] font-medium">
                            {p.attendanceCount}/{p.totalSessions}
                          </div>
                          <div className="text-[12px] text-[#5B687A]">{pct}%</div>
                        </td>
                        <td className="py-3.5 px-4 text-[13px] font-mono-num text-[#4D5B6D]">
                          {docsCount}/3 berkas
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusIndicator status={p.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right relative" data-row-menu>
                          <button
                            type="button"
                            aria-label={`Aksi untuk ${p.fullName}`}
                            aria-expanded={openMenuId === p.id}
                            onClick={() =>
                              setOpenMenuId((prev) => (prev === p.id ? null : p.id))
                            }
                            className="w-9 h-9 rounded-[7px] inline-flex items-center justify-center text-[#5B687A] hover:bg-[#EEF2F7] hover:text-[#0D1B2A] cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openMenuId === p.id && (
                            <div className="absolute right-4 top-12 z-30 w-52 bg-white border border-[#CBD4E1] rounded-[8px] shadow-[0_10px_24px_rgba(8,35,64,0.14)] py-1 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailParticipantId(p.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-[13px] text-[#0D1B2A] hover:bg-[#F8F9FB] flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#5B687A]" />
                                Lihat Detail & Berkas
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCertificateParticipant(p);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-[13px] text-[#0D1B2A] hover:bg-[#F8F9FB] flex items-center gap-2 cursor-pointer"
                              >
                                <FileBadge2 className="w-3.5 h-3.5 text-[#855E1E]" />
                                Surat Kesiapan (PDF)
                              </button>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingParticipant(p);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-[13px] text-[#0D1B2A] hover:bg-[#F8F9FB] flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-[#5B687A]" />
                                  Ubah Data
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmDeleteId(p.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-[13px] text-[#B42318] hover:bg-[#FEF2F2] flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Hapus Peserta
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Card View */}
          <div className="md:hidden space-y-3">
            {paginated.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-[#E2E7EF] rounded-[10px] p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setDetailParticipantId(p.id)}
                      className="text-[15px] font-semibold text-[#0D1B2A] text-left hover:underline"
                    >
                      {p.fullName}
                    </button>
                    <p className="text-[12px] text-[#5B687A] mt-0.5">
                      {p.code} · Lingk. {p.lingkungan}
                    </p>
                  </div>
                  <StatusIndicator status={p.status} />
                </div>

                <div className="flex items-center justify-between text-[13px] text-[#4D5B6D] pt-2 border-t border-[#EEF1F6]">
                  <span>{p.program}</span>
                  <span className="font-mono-num text-[#0D1B2A] font-medium">
                    Hadir {p.attendanceCount}/{p.totalSessions}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => setDetailParticipantId(p.id)}
                  >
                    Detail
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => setCertificateParticipant(p)}
                  >
                    Surat PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <p className="text-[13px] text-[#5B687A] tabular-nums" aria-live="polite">
              Menampilkan{' '}
              <span className="font-medium text-[#0D1B2A]">
                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}
              </span>{' '}
              dari <span className="font-medium text-[#0D1B2A]">{filtered.length}</span> peserta
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Sebelumnya
              </Button>
              <span className="px-3 text-[13px] font-mono-num text-[#0D1B2A]">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4 ml-1 inline" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Participant Detail Slide-Over Drawer */}
      <SlideOverDrawer
        open={Boolean(detailParticipant)}
        onClose={() => setDetailParticipantId(null)}
        title={detailParticipant?.fullName || ''}
        subtitle={
          detailParticipant
            ? `${detailParticipant.code} · ${detailParticipant.program}`
            : undefined
        }
        footer={
          detailParticipant && (
            <>
              {canDelete && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setConfirmDeleteId(detailParticipant.id);
                    setDetailParticipantId(null);
                  }}
                  className="text-[#B42318] hover:bg-[#FEF2F2] mr-auto"
                >
                  Hapus
                </Button>
              )}
              <Button
                variant="secondary"
                icon={<FileBadge2 className="w-4 h-4" />}
                onClick={() => setCertificateParticipant(detailParticipant)}
              >
                Surat PDF
              </Button>
              {canEdit &&
                !detailHasPendingApproval &&
                detailParticipant.status !== 'Siap Sakramen' &&
                detailParticipant.status !== 'Selesai' && (
                  <Button
                    variant="secondary"
                    icon={<Send className="w-4 h-4" />}
                    onClick={() => openSubmitApprovalModal(detailParticipant)}
                  >
                    {detailParticipant.status === 'Perlu Revisi'
                      ? 'Ajukan Ulang ke Pastor'
                      : 'Ajukan ke Pastor'}
                  </Button>
                )}
              {canEdit && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditingParticipant(detailParticipant);
                    setDetailParticipantId(null);
                  }}
                >
                  Ubah Data
                </Button>
              )}
            </>
          )
        }
      >
        {detailParticipant && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EEF1F6]">
              <span className="text-[13px] text-[#5B687A]">Status Saat Ini</span>
              <StatusIndicator status={detailParticipant.status} />
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-[14px]">
              <div>
                <dt className="text-[12px] text-[#5B687A]">Lingkungan</dt>
                <dd className="mt-0.5 font-medium text-[#0D1B2A]">
                  Lingkungan {detailParticipant.lingkungan}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-[#5B687A]">Kelas Pembinaan</dt>
                <dd className="mt-0.5 font-medium text-[#0D1B2A]">
                  {getClassName(detailParticipant.classId)}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-[#5B687A]">Nomor Telepon / WhatsApp</dt>
                <dd className="mt-0.5 font-mono-num text-[#0D1B2A]">{detailParticipant.phone}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-[#5B687A]">Email</dt>
                <dd className="mt-0.5 text-[#0D1B2A] break-all">{detailParticipant.email}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-[#5B687A]">Tanggal Lahir</dt>
                <dd className="mt-0.5 font-mono-num text-[#0D1B2A]">
                  {detailParticipant.birthDate}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-[#5B687A]">Wali / Orang Tua</dt>
                <dd className="mt-0.5 font-medium text-[#0D1B2A]">
                  {detailParticipant.sponsorName}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-[#5B687A]">Kehadiran Pertemuan</dt>
                <dd className="mt-0.5 font-mono-num font-semibold text-[#082340]">
                  {detailParticipant.attendanceCount} dari {detailParticipant.totalSessions} pertemuan (
                  {Math.round(
                    (detailParticipant.attendanceCount /
                      Math.max(1, detailParticipant.totalSessions)) *
                      100
                  )}
                  %)
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-[#5B687A]">Tanggal Terdaftar</dt>
                <dd className="mt-0.5 font-mono-num text-[#0D1B2A]">
                  {detailParticipant.registeredAt}
                </dd>
              </div>
            </dl>

            {/* Approval Handoff Status for Staff */}
            <div className="pt-4 border-t border-[#EEF1F6]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="text-[14px] font-semibold text-[#0D1B2A]">
                  Status Persetujuan Pastor Paroki
                </h3>
                {detailLatestApproval && <StatusIndicator status={detailLatestApproval.status} />}
              </div>
              {detailHasPendingApproval && detailLatestApproval ? (
                <div className="p-3.5 rounded-[8px] bg-[#FBF6EC] border border-[#E5CFA6] text-[13px] text-[#6B4A14]">
                  <p className="font-medium">
                    Sedang menunggu keputusan Pastor Paroki ({detailLatestApproval.requestType})
                  </p>
                  <p className="mt-1 text-[12px]">
                    Kode {detailLatestApproval.code} · Diajukan pada {detailLatestApproval.submittedAt} oleh{' '}
                    {detailLatestApproval.submittedBy}.
                  </p>
                </div>
              ) : detailLatestApproval ? (
                <div className="p-3.5 rounded-[8px] bg-[#F8F9FB] border border-[#E2E7EF] text-[13px] text-[#334155]">
                  <p className="font-medium text-[#0D1B2A]">
                    {detailLatestApproval.requestType} ({detailLatestApproval.code})
                  </p>
                  {detailLatestApproval.decisionNote && (
                    <p className="mt-1 leading-relaxed">{detailLatestApproval.decisionNote}</p>
                  )}
                  <p className="mt-1 text-[12px] text-[#5B687A]">
                    Diputuskan oleh {detailLatestApproval.decidedBy || 'Pastor Paroki'} pada{' '}
                    {detailLatestApproval.decidedAt || detailLatestApproval.submittedAt}.
                  </p>
                </div>
              ) : (
                <p className="text-[13px] text-[#5B687A]">
                  Belum ada pengajuan persetujuan untuk peserta ini. Setelah berkas diperiksa, Anda dapat mengajukannya ke Pastor Paroki.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-[#EEF1F6]">
              <h3 className="text-[14px] font-semibold text-[#0D1B2A] mb-3">
                Berkas Administrasi & Lampiran Digital
              </h3>
              <ParticipantDocumentsPanel
                participant={detailParticipant}
                canUpload={canEdit}
                compact
              />
            </div>

            {detailParticipant.notes && (
              <div className="pt-4 border-t border-[#EEF1F6]">
                <h3 className="text-[14px] font-semibold text-[#0D1B2A] mb-1.5">Catatan</h3>
                <p className="text-[14px] text-[#4D5B6D] leading-relaxed">
                  {detailParticipant.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </SlideOverDrawer>

      {/* Submit / Resubmit Approval Modal */}
      <Modal
        open={Boolean(approvalModalParticipant)}
        onClose={() => setApprovalModalParticipant(null)}
        title={
          approvalModalParticipant?.status === 'Perlu Revisi'
            ? 'Ajukan Ulang ke Pastor Paroki'
            : 'Ajukan Persetujuan ke Pastor Paroki'
        }
        description={
          approvalModalParticipant
            ? `${approvalModalParticipant.fullName} · ${approvalModalParticipant.program} · Lingkungan ${approvalModalParticipant.lingkungan}`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setApprovalModalParticipant(null)}>
              Batal
            </Button>
            <Button
              variant="primary"
              loading={submittingApproval}
              icon={<Send className="w-4 h-4" />}
              onClick={(e) => void handleConfirmSubmitApproval(e)}
            >
              Kirim ke Antrean Pastor
            </Button>
          </>
        }
      >
        {approvalModalParticipant && (
          <form onSubmit={(e) => void handleConfirmSubmitApproval(e)} className="space-y-4">
            <div className="p-3.5 rounded-[8px] bg-[#F8F9FB] border border-[#E2E7EF] grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <span className="block text-[12px] text-[#5B687A]">Kehadiran Saat Ini</span>
                <span className="font-mono-num font-semibold text-[#082340]">
                  {approvalModalParticipant.attendanceCount}/{approvalModalParticipant.totalSessions}{' '}
                  (
                  {Math.round(
                    (approvalModalParticipant.attendanceCount /
                      Math.max(1, approvalModalParticipant.totalSessions)) *
                      100
                  )}
                  %)
                </span>
              </div>
              <div>
                <span className="block text-[12px] text-[#5B687A]">Kelengkapan Berkas</span>
                <span className="font-medium text-[#0D1B2A]">
                  {
                    [
                      approvalModalParticipant.documents.ktpKk,
                      approvalModalParticipant.documents.suratBaptisAtauRekomendasi,
                      approvalModalParticipant.documents.pasFoto,
                    ].filter(Boolean).length
                  }
                  /3 berkas terverifikasi
                </span>
              </div>
            </div>

            <SelectField
              label="Jenis Pengajuan"
              required
              value={approvalRequestType}
              onChange={(e) =>
                setApprovalRequestType(e.target.value as ApprovalRequest['requestType'])
              }
              options={[
                {
                  value: 'Verifikasi Berkas Pendaftaran',
                  label: 'Verifikasi Berkas Pendaftaran (Disetujui → Aktif)',
                },
                {
                  value: 'Kelayakan Penerimaan Sakramen',
                  label: 'Kelayakan Penerimaan Sakramen (Disetujui → Siap Sakramen)',
                },
                {
                  value: 'Perpindahan Kelas',
                  label: 'Perpindahan Kelas (Disetujui → Aktif)',
                },
              ]}
            />

            <Textarea
              label="Catatan Pengajuan untuk Pastor Paroki"
              value={approvalSummaryNote}
              onChange={(e) => setApprovalSummaryNote(e.target.value)}
              placeholder="Contoh: Seluruh berkas fisik & digital telah diperiksa, kehadiran peserta memenuhi syarat."
            />
          </form>
        )}
      </Modal>

      {/* Edit Modal */}
      <ParticipantEditModal
        participant={editingParticipant}
        onClose={() => setEditingParticipant(null)}
      />

      {/* Sacrament Readiness Certificate Preview & PDF Download */}
      <CertificatePreviewModal
        participant={certificateParticipant}
        catechesisClass={classes.find((c) => c.id === certificateParticipant?.classId)}
        approval={approvals.find((a) => a.participantId === certificateParticipant?.id)}
        settings={settings}
        onClose={() => setCertificateParticipant(null)}
      />

      {/* Confirm Single Delete */}
      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            void deleteParticipant(confirmDeleteId);
            setSelectedIds((prev) => prev.filter((id) => id !== confirmDeleteId));
          }
        }}
        title="Hapus Data Peserta?"
        description="Data peserta dan pengajuan terkait akan dihapus dari daftar aktif. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Peserta"
      />

      {/* Confirm Bulk Delete */}
      <ConfirmDialog
        open={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={() => {
          void bulkDeleteParticipants(selectedIds);
          setSelectedIds([]);
        }}
        title={`Hapus ${selectedIds.length} Peserta Terpilih?`}
        description="Seluruh data peserta yang dipilih akan dihapus dari sistem secara permanen."
        confirmLabel="Ya, Hapus Semua Terpilih"
      />
    </div>
  );
};
