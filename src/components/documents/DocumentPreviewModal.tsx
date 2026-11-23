import React, { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { ParticipantAttachment } from '../../types/catevia';
import {
  DOCUMENT_TYPE_LABELS,
  formatFileSize,
  isSafeAttachmentPreviewUrl,
  safeDataUrlToBlob,
} from '../../utils/documentUpload';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface DocumentPreviewModalProps {
  attachment: ParticipantAttachment | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  attachment,
  onClose,
}) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const hasSafePreview =
    attachment !== null &&
    isSafeAttachmentPreviewUrl(attachment.previewDataUrl, attachment.mimeType);

  useEffect(() => {
    if (!attachment || !hasSafePreview || attachment.mimeType !== 'application/pdf') {
      setPdfBlobUrl(null);
      return;
    }
    const blob = safeDataUrlToBlob(attachment.previewDataUrl!, 'application/pdf');
    if (!blob) {
      setPdfBlobUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setPdfBlobUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [attachment, hasSafePreview]);

  const handleDownload = () => {
    if (!attachment || !hasSafePreview || !attachment.previewDataUrl) return;
    const blob = safeDataUrlToBlob(attachment.previewDataUrl, attachment.mimeType);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.fileName.replace(/[/\\:*?"<>|]/g, '_');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Modal
      open={Boolean(attachment)}
      onClose={onClose}
      title={attachment ? DOCUMENT_TYPE_LABELS[attachment.docType] : 'Pratinjau Dokumen'}
      description={
        attachment
          ? `${attachment.fileName} · ${formatFileSize(attachment.fileSizeBytes)} · Diunggah oleh ${attachment.uploadedByName}`
          : undefined
      }
      maxWidthClass="max-w-2xl"
      footer={
        <>
          {hasSafePreview && (
            <Button
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={handleDownload}
            >
              Unduh Berkas
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Tutup Pratinjau
          </Button>
        </>
      }
    >
      {attachment && (
        <div className="space-y-4">
          {attachment.mimeType.startsWith('image/') && hasSafePreview ? (
            <div className="rounded-[8px] border border-[#E2E7EF] bg-[#F8F9FB] p-3 flex items-center justify-center overflow-hidden">
              <img
                src={attachment.previewDataUrl}
                alt={`Pratinjau ${DOCUMENT_TYPE_LABELS[attachment.docType]}`}
                className="max-h-[60vh] w-auto object-contain rounded-[4px]"
              />
            </div>
          ) : attachment.mimeType === 'application/pdf' && pdfBlobUrl ? (
            <div className="rounded-[8px] border border-[#E2E7EF] overflow-hidden bg-[#F8F9FB]">
              <iframe
                title={attachment.fileName}
                src={pdfBlobUrl}
                sandbox=""
                className="w-full h-[55vh] bg-white"
              />
            </div>
          ) : (
            <div className="rounded-[8px] border border-[#E2E7EF] bg-[#F8F9FB] p-8 text-center">
              <div className="w-12 h-12 rounded-[10px] bg-white border border-[#E2E7EF] text-[#082340] flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" aria-hidden="true" />
              </div>
              <p className="text-[15px] font-semibold text-[#0D1B2A]">{attachment.fileName}</p>
              <p className="mt-1 text-[13px] text-[#4D5B6D]">
                Dokumen PDF ({formatFileSize(attachment.fileSizeBytes)}) telah tercatat dan
                terverifikasi di basis data paroki.
              </p>
              <p className="mt-1 text-[12px] text-[#69778A]">
                Diunggah oleh {attachment.uploadedByName} · {attachment.uploadedAt}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#5B687A] pt-2 border-t border-[#EEF1F6]">
            <span>Format: {attachment.mimeType}</span>
            <span className="font-mono-num">
              Ukuran: {formatFileSize(attachment.fileSizeBytes)} · Diunggah {attachment.uploadedAt}
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
};
