export type UserRole = 'admin' | 'operational' | 'approver' | 'general';

export type PageId =
  | 'dashboard'
  | 'participants'
  | 'classes'
  | 'materials'
  | 'approvals'
  | 'reports'
  | 'cms'
  | 'users'
  | 'settings';

export type Permission =
  | 'view_dashboard'
  | 'view_participants'
  | 'create_participant'
  | 'edit_participant'
  | 'delete_participant'
  | 'bulk_manage_participants'
  | 'view_classes'
  | 'manage_classes'
  | 'record_attendance'
  | 'view_materials'
  | 'manage_materials'
  | 'view_approvals'
  | 'decide_approvals'
  | 'view_reports'
  | 'export_reports'
  | 'manage_cms'
  | 'manage_users'
  | 'manage_settings';

export type ProgramType =
  | 'Katekumen (Baptis Dewasa)'
  | 'Komuni Pertama'
  | 'Krisma (Penguatan)';

export type ParticipantStatus =
  | 'Aktif'
  | 'Menunggu Verifikasi'
  | 'Perlu Revisi'
  | 'Siap Sakramen'
  | 'Selesai';

export type ApprovalStatus = 'Menunggu' | 'Disetujui' | 'Perlu Revisi' | 'Ditolak';

export type DocumentTypeKey = 'ktpKk' | 'suratBaptisAtauRekomendasi' | 'pasFoto';

export interface ParticipantDocument {
  ktpKk: boolean;
  suratBaptisAtauRekomendasi: boolean;
  pasFoto: boolean;
}

export interface ParticipantAttachment {
  id: string;
  participantId: string;
  docType: DocumentTypeKey;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  fileSizeBytes: number;
  previewDataUrl?: string;
  uploadedByUid: string;
  uploadedByName: string;
  uploadedAt: string;
}

export interface PendingUploadFile {
  docType: DocumentTypeKey;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  fileSizeBytes: number;
  previewDataUrl?: string;
}

export interface Participant {
  id: string;
  code: string;
  fullName: string;
  birthDate: string;
  phone: string;
  email: string;
  lingkungan: string;
  program: ProgramType;
  classId: string;
  sponsorName: string;
  status: ParticipantStatus;
  attendanceCount: number;
  totalSessions: number;
  registeredAt: string;
  ownerUid?: string;
  documents: ParticipantDocument;
  notes?: string;
}

export interface ClassSession {
  id: string;
  date: string;
  topic: string;
  completed: boolean;
  presentParticipantIds: string[];
}

export interface CatechesisClass {
  id: string;
  code: string;
  name: string;
  program: ProgramType;
  catechistName: string;
  scheduleDay: string;
  scheduleTime: string;
  room: string;
  capacity: number;
  status: 'Aktif' | 'Selesai' | 'Dijadwalkan';
  sessions: ClassSession[];
}

export interface ApprovalHistoryItem {
  id: string;
  date: string;
  actorName: string;
  actorRole: string;
  action: string;
  note: string;
}

export interface ApprovalRequest {
  id: string;
  code: string;
  participantId: string;
  participantName: string;
  program: ProgramType;
  lingkungan: string;
  requestType: 'Kelayakan Penerimaan Sakramen' | 'Verifikasi Berkas Pendaftaran' | 'Perpindahan Kelas';
  submittedBy: string;
  submittedByUid?: string;
  submittedAt: string;
  status: ApprovalStatus;
  attendanceSummary: string;
  documentsComplete: boolean;
  summaryNote: string;
  decisionNote?: string;
  decidedAt?: string;
  decidedBy?: string;
  history: ApprovalHistoryItem[];
}

export interface StudyMaterial {
  id: string;
  title: string;
  program: ProgramType | 'Semua Program';
  sessionNumber: number;
  durationMinutes: number;
  author: string;
  updatedAt: string;
  summary: string;
  keyPoints: string[];
  completedByCurrentUser?: boolean;
}

export interface SystemUser {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: UserRole;
  lingkungan: string;
  active: boolean;
  lastActive: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  read: boolean;
  targetPage: PageId;
  roles: UserRole[];
  recipientUid?: string;
}

export interface ParishSettings {
  parishName: string;
  diocese: string;
  academicYear: string;
  minimumAttendancePercent: number;
  pastorName: string;
  coordinatorName: string;
  contactEmail: string;
  contactPhone: string;
  autoNotifyLingkungan: boolean;
  requireSponsorVerification: boolean;
}

export interface ParticipantDraft {
  step: number;
  fullName: string;
  birthDate: string;
  phone: string;
  email: string;
  lingkungan: string;
  program: ProgramType;
  classId: string;
  sponsorName: string;
  documents: ParticipantDocument;
  notes: string;
  savedAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

export type SiteMode = 'public' | 'login' | 'portal';

export interface FrontpageRegistrationPayload {
  fullName: string;
  birthDate: string;
  phone: string;
  email: string;
  lingkungan: string;
  program: ProgramType;
  classId: string;
  sponsorName: string;
  documents: ParticipantDocument;
  notes?: string;
}

export interface FrontpageRegistrationResult {
  participantId: string;
  code: string;
  fullName: string;
  program: ProgramType;
  className: string;
  lingkungan: string;
  registeredAt: string;
  status: ParticipantStatus;
}

export type PublicProgramStatus = 'Pendaftaran Dibuka' | 'Akan Dibuka' | 'Ditutup';

export type PublicProgramIconType = 'baptis' | 'ekaristi' | 'krisma' | 'persink' | 'umum';

export interface PublicProgram {
  id: string;
  name: string;
  iconType: PublicProgramIconType;
  audience: string;
  mode: string;
  scheduleSummary: string;
  status: PublicProgramStatus;
  summary: string;
  overview: string;
  learnItems: string[];
  requirements: string[];
  documents: string[];
  policyNote: string;
  linkedProgram: ProgramType | '';
  published: boolean;
  displayOrder: number;
  updatedAt?: string;
}

export interface RoleHighlightItem {
  title: string;
  description: string;
  iconType: 'user' | 'book' | 'cross' | 'settings';
}

export interface GuideStepItem {
  title: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FrontpageContent {
  parishLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  heroPrimaryCtaLabel: string;
  heroSecondaryCtaLabel: string;

  showScriptureSection: boolean;
  scriptureHeading: string;
  scriptureQuote: string;
  scriptureSource: string;
  scriptureNote: string;

  programsEyebrow: string;
  programsHeading: string;
  programsSubtitle: string;

  showRolesSection: boolean;
  rolesHeading: string;
  rolesSubtitle: string;
  roleHighlights: RoleHighlightItem[];

  aboutTitle: string;
  aboutContent: string;
  aboutHighlights: string[];

  guideTitle: string;
  guideIntro: string;
  guideSteps: GuideStepItem[];

  showFaqSection: boolean;
  faqs: FaqItem[];

  contactTitle: string;
  contactDescription: string;
  contactAddress: string;
  contactHours: string;
  contactEmail: string;
  contactPhone: string;

  footerTagline: string;
  footerCopyright: string;
}

