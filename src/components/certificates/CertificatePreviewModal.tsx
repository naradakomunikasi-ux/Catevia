import React, { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import {
  ApprovalRequest,
  CatechesisClass,
  ParishSettings,
  Participant,
} from '../../types/catevia';
import {
  buildCertificateNumber,
  formatIndonesianDate,
  generateSacramentCertificatePdf,
} from '../../utils/certificatePdf';
import { CATEVIA_LOGO_PATH } from '../layout/Sidebar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';

interface CertificatePreviewModalProps {
  participant: Participant | null;
  catechesisClass?: CatechesisClass;
  approval?: ApprovalRequest;
  settings: ParishSettings;
  onClose: () => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  participant,
  catechesisClass,
  approval,
  settings,
  onClose,
}) => {
  const { showToast } = useApp();
  const [downloading, setDownloading] = useState(false);

  if (!participant) return null;

  const certNumber = buildCertificateNumber(participant);
  const attendancePct = Math.round(
    (participant.attendanceCount / Math.max(1, participant.totalSessions)) * 100
  );
  const docsComplete =
    participant.documents.ktpKk &&
    participant.documents.suratBaptisAtauRekomendasi &&
    participant.documents.pasFoto;

  const handleDownloadPdf = () => {
    setDownloading(true);
    try {
      generateSacramentCertificatePdf({
        participant,
        catechesisClass,
        approval,
        settings,
      });
      showToast({
        type: 'success',
        title: 'Surat Keterangan PDF berhasil diunduh',
        description: `Dokumen ${certNumber} untuk ${participant.fullName} siap dicetak.`,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Gagal membuat dokumen PDF',
        description: 'Silakan coba kembali beberapa saat lagi.',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      open={Boolean(participant)}
      onClose={onClose}
      title="Surat Keterangan Kesiapan Sakramen"
      description={`Pratinjau resmi dokumen Sekretariat · ${certNumber}`}
      maxWidthClass="max-w-3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          <Button
            variant="secondary"
            icon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Cetak Langsung
          </Button>
          <Button
            variant="primary"
            loading={downloading}
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownloadPdf}
          >
            Unduh PDF Resmi
          </Button>
        </>
      }
    >
      {/* Printable Formal Certificate Sheet */}
      <div className="catevia-printable-certificate bg-white border-2 border-[#082340] p-1.5 rounded-[4px]">
        <div className="border border-[#B8893E] px-6 sm:px-8 py-7 space-y-6">
          {/* Kop Surat Paroki */}
          <div className="text-center pb-4 border-b-2 border-[#082340]">
            <div className="flex justify-center mb-2">
              <img
                src={CATEVIA_LOGO_PATH}
                alt="Catevia"
                referrerPolicy="no-referrer"
                className="h-9 w-auto object-contain"
              />
            </div>
            <p className="text-[11px] font-semibold tracking-wider text-[#855E1E] uppercase">
              {settings.diocese}
            </p>
            <h3 className="text-[20px] font-bold text-[#082340] mt-0.5">
              {settings.parishName}
            </h3>
            <p className="text-[12px] text-[#4D5B6D] mt-0.5">
              Seksi Katekese & Pembinaan Iman · {settings.contactEmail} · {settings.contactPhone}
            </p>
          </div>

          {/* Document Title */}
          <div className="text-center">
            <h4 className="text-[16px] font-bold tracking-wide text-[#082340]">
              SURAT KETERANGAN KESIAPAN SAKRAMEN
            </h4>
            <p className="text-[12px] font-mono-num text-[#5B687A] mt-1">
              Nomor: {certNumber}
            </p>
          </div>

          <p className="text-[13px] text-[#0D1B2A] leading-relaxed">
            Berdasarkan catatan pembinaan katekese periode{' '}
            <span className="font-medium">{settings.academicYear}</span> di {settings.parishName},
            dengan ini menerangkan bahwa peserta di bawah ini telah mengikuti rangkaian pendampingan
            iman dan dinyatakan siap untuk menerima sakramen sesuai ketentuan Gereja:
          </p>

          {/* Details Table */}
          <div className="rounded-[6px] border border-[#E2E7EF] bg-[#F8F9FB] px-5 py-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[13px]">
              <div>
                <dt className="text-[#5B687A]">Nama Lengkap</dt>
                <dd className="font-semibold text-[#0D1B2A]">{participant.fullName}</dd>
              </div>
              <div>
                <dt className="text-[#5B687A]">Kode Registrasi</dt>
                <dd className="font-mono-num font-semibold text-[#0D1B2A]">{participant.code}</dd>
              </div>
              <div>
                <dt className="text-[#5B687A]">Tanggal Lahir</dt>
                <dd className="text-[#0D1B2A]">{formatIndonesianDate(participant.birthDate)}</dd>
              </div>
              <div>
                <dt className="text-[#5B687A]">Lingkungan Domisili</dt>
                <dd className="text-[#0D1B2A]">Lingkungan {participant.lingkungan}</dd>
              </div>
              <div>
                <dt className="text-[#5B687A]">Program Sakramen</dt>
                <dd className="font-semibold text-[#082340]">{participant.program}</dd>
              </div>
              <div>
                <dt className="text-[#5B687A]">Kelas Pembinaan</dt>
                <dd className="text-[#0D1B2A]">{catechesisClass?.name || '-'}</dd>
              </div>
              <div>
                <dt className="text-[#5B687A]">Katekis Pendamping</dt>
                <dd className="text-[#0D1B2A]">
                  {catechesisClass?.catechistName || settings.coordinatorName}
                </dd>
              </div>
              <div>
                <dt className="text-[#5B687A]">Wali / Orang Tua</dt>
                <dd className="text-[#0D1B2A]">{participant.sponsorName}</dd>
              </div>
            </dl>
          </div>

          {/* Verification Summary */}
          <div className="space-y-1.5 text-[13px] text-[#334155]">
            <p className="font-semibold text-[#082340]">Ringkasan Verifikasi Kelayakan</p>
            <p>
              • Kehadiran:{' '}
              <span className="font-mono-num font-medium text-[#0D1B2A]">
                {participant.attendanceCount} dari {participant.totalSessions} pertemuan ({attendancePct}%)
              </span>{' '}
              — syarat minimal {settings.minimumAttendancePercent}%
            </p>
            <p>
              • Berkas Administrasi:{' '}
              <span className="font-medium text-[#0D1B2A]">
                {docsComplete
                  ? 'Lengkap (KTP/KK, Surat Baptis/Rekomendasi, Pas Foto 3×4)'
                  : 'Menunggu kelengkapan fisik di Sekretariat'}
              </span>
            </p>
            <p>
              • Pengesahan Pastor Paroki:{' '}
              <span className="font-medium text-[#0D1B2A]">
                {approval?.decidedBy
                  ? `${approval.status} oleh ${approval.decidedBy} (${formatIndonesianDate(approval.decidedAt)})`
                  : participant.status}
              </span>
            </p>
          </div>

          {/* Signature Block */}
          <div className="pt-4">
            <p className="text-right text-[12px] text-[#4D5B6D] mb-5">
              Diterbitkan di {settings.parishName}, {formatIndonesianDate()}
            </p>
            <div className="grid grid-cols-2 gap-6 text-center text-[12px]">
              <div>
                <p className="text-[#5B687A]">Koordinator Seksi Katekese</p>
                <div className="h-14" />
                <p className="font-semibold text-[#082340] border-t border-[#CBD4E1] pt-1.5 mx-6">
                  {settings.coordinatorName}
                </p>
              </div>
              <div>
                <p className="text-[#5B687A]">Mengetahui, Pastor Kepala Paroki</p>
                <div className="h-14" />
                <p className="font-semibold text-[#082340] border-t border-[#CBD4E1] pt-1.5 mx-6">
                  {settings.pastorName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
