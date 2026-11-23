import React, { useEffect, useRef, useState } from 'react';
import { Eye, FileText, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import { DocumentTypeKey, Participant, ParticipantAttachment } from '../../types/catevia';
import {
  DOCUMENT_TYPE_LABELS,
  formatFileSize,
  prepareDocumentUpload,
} from '../../utils/documentUpload';
import { useApp } from '../../context/AppContext';
import { StatusIndicator } from '../ui/StatusIndicator';
import { Button } from '../ui/Button';
import { DocumentPreviewModal } from './DocumentPreviewModal';

const DOC_TYPES: DocumentTypeKey[] = ['ktpKk', 'suratBaptisAtauRekomendasi', 'pasFoto'];

interface ParticipantDocumentsPanelProps {
  participant: Participant;
  canUpload: boolean;
  compact?: boolean;
}

export const ParticipantDocumentsPanel: React.FC<ParticipantDocumentsPanelProps> = ({
  participant,
  canUpload,
  compact = false,
}) => {
  const { loadParticipantAttachments, uploadParticipantAttachment, showToast } = useApp();
  const [attachments, setAttachments] = useState<Partial<Record<DocumentTypeKey, ParticipantAttachment>>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<DocumentTypeKey | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<ParticipantAttachment | null>(null);
  const fileInputsRef = useRef<Partial<Record<DocumentTypeKey, HTMLInputElement | null>>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadParticipantAttachments(participant.id)
      .then((list) => {
        if (!active) return;
        const mapped: Partial<Record<DocumentTypeKey, ParticipantAttachment>> = {};
        list.forEach((item) => {
          mapped[item.docType] = item;
        });
        setAttachments(mapped);
      })
      .catch(() => {
        // Error surfaced via handleFirestoreError / toast
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [participant.id, loadParticipantAttachments]);

  const handleFileChange = async (docType: DocumentTypeKey, file: File | undefined) => {
    if (!file) return;
    setUploadingKey(docType);
    try {
      const prepared = await prepareDocumentUpload(file, docType);
      const saved = await uploadParticipantAttachment(participant.id, prepared);
      setAttachments((prev) => ({ ...prev, [docType]: saved }));
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal mengunggah berkas',
        description: err instanceof Error ? err.message : 'Periksa format dan ukuran berkas.',
      });
    } finally {
      setUploadingKey(null);
      const inputEl = fileInputsRef.current[docType];
      if (inputEl) inputEl.value = '';
    }
  };

  return (
    <div className="space-y-2.5">
      {DOC_TYPES.map((docType) => {
        const isChecked = participant.documents[docType];
        const attachment = attachments[docType];
        const isUploading = uploadingKey === docType;

        return (
          <div
            key={docType}
            className={`rounded-[8px] border border-[#E2E7EF] bg-[#FAFBFC] ${
              compact ? 'p-3' : 'p-3.5'
            } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-[#0D1B2A]">
                  {DOCUMENT_TYPE_LABELS[docType]}
                </span>
                <StatusIndicator status={isChecked || Boolean(attachment) ? 'Lengkap' : 'Belum Lengkap'} />
              </div>

              {loading ? (
                <p className="mt-1 text-[12px] text-[#69778A]">Memeriksa berkas terunggah...</p>
              ) : attachment ? (
                <p className="mt-1 text-[12px] text-[#5B687A] flex items-center gap-1.5 truncate">
                  {attachment.mimeType.startsWith('image/') ? (
                    <ImageIcon className="w-3.5 h-3.5 shrink-0 text-[#082340]" aria-hidden="true" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 shrink-0 text-[#082340]" aria-hidden="true" />
                  )}
                  <span className="truncate">{attachment.fileName}</span>
                  <span className="font-mono-num shrink-0">
                    ({formatFileSize(attachment.fileSizeBytes)})
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-[12px] text-[#69778A]">
                  {isChecked
                    ? 'Tercatat lengkap secara fisik (belum ada salinan digital).'
                    : 'Belum ada berkas digital yang diunggah (JPG, PNG, WebP, atau PDF).'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {attachment && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => setPreviewAttachment(attachment)}
                >
                  Lihat Berkas
                </Button>
              )}

              {canUpload && (
                <>
                  <input
                    ref={(el) => {
                      fileInputsRef.current[docType] = el;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="sr-only"
                    id={`upload-${participant.id}-${docType}`}
                    onChange={(e) => void handleFileChange(docType, e.target.files?.[0])}
                  />
                  <Button
                    variant={attachment ? 'ghost' : 'secondary'}
                    size="sm"
                    disabled={isUploading}
                    icon={
                      isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )
                    }
                    onClick={() => fileInputsRef.current[docType]?.click()}
                  >
                    {isUploading ? 'Mengunggah...' : attachment ? 'Ganti' : 'Unggah'}
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}

      <DocumentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
};
