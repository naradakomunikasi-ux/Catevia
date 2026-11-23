import { jsPDF } from 'jspdf';
import {
  ApprovalRequest,
  CatechesisClass,
  ParishSettings,
  Participant,
} from '../types/catevia';

export interface CertificateData {
  participant: Participant;
  catechesisClass?: CatechesisClass;
  approval?: ApprovalRequest;
  settings: ParishSettings;
}

export function buildCertificateNumber(participant: Participant): string {
  const year = new Date().getFullYear();
  return `SKKS/${year}/${participant.code}`;
}

export function formatIndonesianDate(isoDate?: string): string {
  if (!isoDate) {
    return new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Parse YYYY-MM-DD as local calendar date to avoid UTC off-by-one-day timezone shift
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  const parsed = isoMatch
    ? new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
    : new Date(isoDate);

  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function generateSacramentCertificatePdf(data: CertificateData): void {
  const { participant, catechesisClass, approval, settings } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const navy: [number, number, number] = [8, 35, 64];
  const gold: [number, number, number] = [184, 137, 62];
  const slate: [number, number, number] = [77, 91, 109];
  const ink: [number, number, number] = [13, 27, 42];
  const lightBorder: [number, number, number] = [226, 231, 239];

  // Outer institutional border
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.8);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  doc.setDrawColor(...gold);
  doc.setLineWidth(0.35);
  doc.rect(14.5, 14.5, pageWidth - 29, pageHeight - 29);

  // Header Block
  let y = 27;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...gold);
  doc.text(settings.diocese.toUpperCase(), pageWidth / 2, y, { align: 'center' });

  y += 6.5;
  doc.setFontSize(16);
  doc.setTextColor(...navy);
  doc.text(settings.parishName.toUpperCase(), pageWidth / 2, y, { align: 'center' });

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...slate);
  doc.text(
    `Seksi Katekese & Pembinaan Iman  |  ${settings.contactEmail}  |  ${settings.contactPhone}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  // Divider Rule
  y += 5;
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1.2, pageWidth - margin, y + 1.2);

  // Document Title
  y += 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...navy);
  doc.text('SURAT KETERANGAN KESIAPAN SAKRAMEN', pageWidth / 2, y, { align: 'center' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...slate);
  doc.text(`Nomor: ${buildCertificateNumber(participant)}`, pageWidth / 2, y, { align: 'center' });

  // Intro Paragraph
  y += 12;
  doc.setFontSize(10);
  doc.setTextColor(...ink);
  const intro = `Berdasarkan catatan pembinaan katekese periode ${settings.academicYear} di ${settings.parishName}, dengan ini menerangkan bahwa peserta di bawah ini telah mengikuti rangkaian pendampingan iman dan dinyatakan siap untuk menerima sakramen sesuai ketentuan Gereja:`;
  const introLines = doc.splitTextToSize(intro, contentWidth);
  doc.text(introLines, margin, y);
  y += introLines.length * 5.2 + 5;

  // Participant Details Box with safe line-wrapping
  const attendancePct = Math.round(
    (participant.attendanceCount / Math.max(1, participant.totalSessions)) * 100
  );
  const docsComplete =
    participant.documents.ktpKk &&
    participant.documents.suratBaptisAtauRekomendasi &&
    participant.documents.pasFoto;

  const rows: [string, string][] = [
    ['Nama Lengkap', participant.fullName],
    ['Kode Registrasi', participant.code],
    ['Tanggal Lahir', formatIndonesianDate(participant.birthDate)],
    ['Lingkungan Domisili', `Lingkungan ${participant.lingkungan}`],
    ['Program Sakramen', participant.program],
    ['Kelas Pembinaan', catechesisClass ? `${catechesisClass.name} (${catechesisClass.code})` : '-'],
    ['Katekis Pendamping', catechesisClass?.catechistName || settings.coordinatorName],
    ['Wali / Orang Tua', participant.sponsorName],
  ];

  const valueColWidth = contentWidth - 58;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const preparedRows = rows.map(([label, value]) => {
    const wrapped = doc.splitTextToSize(`:  ${value}`, valueColWidth) as string[];
    const clamped = wrapped.slice(0, 2);
    return { label, lines: clamped, height: Math.max(7.6, clamped.length * 4.8 + 2.4) };
  });

  const boxHeight = preparedRows.reduce((sum, r) => sum + r.height, 0) + 6;
  doc.setFillColor(248, 249, 251);
  doc.setDrawColor(...lightBorder);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

  let rowY = y + 7;
  preparedRows.forEach(({ label, lines, height }) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...slate);
    doc.text(label, margin + 5, rowY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ink);
    doc.text(lines, margin + 52, rowY);
    rowY += height;
  });

  y += boxHeight + 9;

  // Verification Summary Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...navy);
  doc.text('RINGKASAN VERIFIKASI KELAYAKAN', margin, y);
  y += 6;

  const summaryItems: [string, string][] = [
    [
      'Kehadiran Pertemuan',
      `${participant.attendanceCount} dari ${participant.totalSessions} pertemuan (${attendancePct}% — syarat min. ${settings.minimumAttendancePercent}%)`,
    ],
    [
      'Kelengkapan Administrasi',
      docsComplete
        ? 'Lengkap (KTP/KK, Surat Baptis/Rekomendasi, Pas Foto 3x4)'
        : 'Sebagian berkas masih menunggu kelengkapan fisik',
    ],
    ['Status Peserta', participant.status],
    [
      'Verifikasi Pastor Paroki',
      approval?.decidedBy
        ? `${approval.status} oleh ${approval.decidedBy} (${formatIndonesianDate(approval.decidedAt)})`
        : participant.status === 'Siap Sakramen' || participant.status === 'Selesai'
          ? `Disetujui (${settings.pastorName})`
          : 'Menunggu pengesahan Pastor Kepala Paroki',
    ],
  ];

  summaryItems.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...slate);
    doc.text(`•  ${label}:`, margin + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...ink);
    const valLines = doc.splitTextToSize(value, contentWidth - 54) as string[];
    doc.text(valLines, margin + 54, y);
    y += Math.max(6.2, valLines.length * 4.8 + 1.2);
  });

  if (approval?.decisionNote || participant.notes) {
    y += 2;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...slate);
    const rawNote = (approval?.decisionNote || participant.notes || '').slice(0, 220);
    const noteText = `Catatan Pastoral: "${rawNote}"`;
    const noteLines = (doc.splitTextToSize(noteText, contentWidth) as string[]).slice(0, 3);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4.6 + 3;
  }

  // Closing & Signature Block (clamped safely above page footer)
  const signatureStartY = Math.min(Math.max(y + 8, 220), 232);
  let sigY = signatureStartY;
  const issueDate = formatIndonesianDate();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...ink);
  doc.text(`Diterbitkan di ${settings.parishName}, ${issueDate}`, pageWidth - margin, sigY, {
    align: 'right',
  });

  sigY += 9;
  const leftSigX = margin + 35;
  const rightSigX = pageWidth - margin - 35;

  doc.setFontSize(9.5);
  doc.setTextColor(...slate);
  doc.text('Koordinator Seksi Katekese', leftSigX, sigY, { align: 'center' });
  doc.text('Mengetahui, Pastor Kepala Paroki', rightSigX, sigY, { align: 'center' });

  sigY += 22;
  doc.setDrawColor(...lightBorder);
  doc.line(leftSigX - 28, sigY, leftSigX + 28, sigY);
  doc.line(rightSigX - 28, sigY, rightSigX + 28, sigY);

  sigY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text(settings.coordinatorName, leftSigX, sigY, { align: 'center' });
  doc.text(settings.pastorName, rightSigX, sigY, { align: 'center' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slate);
  doc.text(
    `Dokumen diterbitkan secara resmi melalui Sistem Manajemen Katekese Catevia · ${buildCertificateNumber(participant)}`,
    pageWidth / 2,
    pageHeight - 17,
    { align: 'center' }
  );

  const safeSlug =
    participant.fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'peserta';
  doc.save(`Surat-Kesiapan-Sakramen-${participant.code}-${safeSlug}.pdf`);
}
