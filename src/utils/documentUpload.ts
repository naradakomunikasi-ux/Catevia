import { DocumentTypeKey, PendingUploadFile } from '../types/catevia';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_RAW_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PREVIEW_CHARS = 165000; // Safely below Firestore rule cap of 180,000 chars

const SAFE_IMAGE_DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const SAFE_PDF_DATA_URL_RE = /^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/;

export const DOCUMENT_TYPE_LABELS: Record<DocumentTypeKey, string> = {
  ktpKk: 'Fotokopi KTP / Kartu Keluarga Katolik',
  suratBaptisAtauRekomendasi: 'Surat Baptis / Rekomendasi Lingkungan',
  pasFoto: 'Pas Foto Berwarna 3×4',
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Runtime allowlist check ensuring stored preview URLs can never execute scripts
 * (blocks javascript:, data:text/html, svg+xml, and malformed URIs).
 */
export function isSafeAttachmentPreviewUrl(
  url: string | undefined,
  mimeType: string
): url is string {
  if (!url || url.length > 180000) return false;
  if (mimeType === 'application/pdf') {
    return SAFE_PDF_DATA_URL_RE.test(url);
  }
  if (mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/webp') {
    return SAFE_IMAGE_DATA_URL_RE.test(url);
  }
  return false;
}

/**
 * Converts a validated base64 data URL into a safe Blob with explicit MIME type.
 */
export function safeDataUrlToBlob(dataUrl: string, mimeType: AllowedMimeType): Blob | null {
  if (!isSafeAttachmentPreviewUrl(dataUrl, mimeType)) return null;
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return null;
  try {
    const base64 = dataUrl.slice(commaIdx + 1);
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  } catch {
    return null;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca berkas.'));
    reader.readAsDataURL(file);
  });
}

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const candidateMaxSides = [960, 640, 480];
        let finalResult = '';

        for (const maxSide of candidateMaxSides) {
          let { width, height } = img;
          if (width > maxSide || height > maxSide) {
            const ratio = Math.min(maxSide / width, maxSide / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Gagal memproses gambar.'));
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.78;
          let result = canvas.toDataURL('image/jpeg', quality);
          while (result.length > MAX_PREVIEW_CHARS && quality > 0.25) {
            quality -= 0.12;
            result = canvas.toDataURL('image/jpeg', quality);
          }

          if (result.length <= MAX_PREVIEW_CHARS) {
            finalResult = result;
            break;
          }
        }

        URL.revokeObjectURL(objectUrl);
        resolve(finalResult);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Berkas gambar tidak dapat dibaca.'));
    };
    img.src = objectUrl;
  });
}

export async function prepareDocumentUpload(
  file: File,
  docType: DocumentTypeKey
): Promise<PendingUploadFile> {
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    throw new Error('Format berkas tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.');
  }

  if (file.size <= 0 || file.size > MAX_RAW_FILE_BYTES) {
    throw new Error('Ukuran berkas maksimal 10 MB.');
  }

  const mimeType = file.type as AllowedMimeType;
  let previewDataUrl: string | undefined;

  if (mimeType.startsWith('image/')) {
    const compressed = await compressImageToDataUrl(file);
    if (compressed && isSafeAttachmentPreviewUrl(compressed, 'image/jpeg')) {
      previewDataUrl = compressed;
    }
  } else if (mimeType === 'application/pdf' && file.size <= 115000) {
    const rawDataUrl = await readFileAsDataUrl(file);
    if (rawDataUrl.length <= MAX_PREVIEW_CHARS && isSafeAttachmentPreviewUrl(rawDataUrl, 'application/pdf')) {
      previewDataUrl = rawDataUrl;
    }
  }

  const safeName = file.name.trim().slice(0, 160) || `dokumen-${docType}`;

  return {
    docType,
    fileName: safeName,
    mimeType,
    fileSizeBytes: Math.round(file.size),
    previewDataUrl,
  };
}
