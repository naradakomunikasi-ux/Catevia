import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  AppNotification,
  ApprovalRequest,
  ApprovalStatus,
  CatechesisClass,
  FrontpageContent,
  FrontpageRegistrationPayload,
  FrontpageRegistrationResult,
  PageId,
  ParishSettings,
  Participant,
  ParticipantAttachment,
  ParticipantDraft,
  ParticipantStatus,
  PendingUploadFile,
  ProgramType,
  PublicProgram,
  PublicProgramIconType,
  PublicProgramStatus,
  SiteMode,
  StudyMaterial,
  SystemUser,
  ToastMessage,
  UserRole,
} from '../types/catevia';
import {
  INITIAL_APPROVALS,
  INITIAL_CLASSES,
  INITIAL_MATERIALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PARTICIPANTS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
} from '../data/seedData';
import {
  DEFAULT_FRONTPAGE_CONTENT,
  DEFAULT_PUBLIC_PROGRAMS,
  isFrontpageOutOfSyncWithParish,
  syncFrontpageWithParishSettings,
} from '../data/cmsDefaults';
import { canAccessPage, ROLE_PROFILES } from '../data/permissions';
import {
  ADMIN_LOGIN_EMAIL,
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  createSecondaryAuthAccount,
  db,
  handleFirestoreError,
  isReservedUsername,
  isValidLoginIdentifier,
  OperationType,
  resolveLoginEmail,
} from '../firebase';

function formatFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : error instanceof Error
        ? error.message
        : '';

  if (
    code.includes('auth/invalid-credential') ||
    code.includes('auth/wrong-password') ||
    code.includes('auth/user-not-found') ||
    code.includes('auth/invalid-email')
  ) {
    return 'Username/email atau kata sandi tidak sesuai. Periksa kembali lalu coba lagi.';
  }
  if (code.includes('auth/email-already-in-use')) {
    return 'Username atau email tersebut sudah terdaftar. Silakan masuk dengan kata sandi Anda.';
  }
  if (code.includes('auth/weak-password')) {
    return 'Kata sandi terlalu lemah. Gunakan minimal 8 karakter.';
  }
  if (code.includes('auth/too-many-requests')) {
    return 'Terlalu banyak percobaan masuk. Tunggu beberapa menit sebelum mencoba lagi.';
  }
  if (code.includes('auth/user-disabled')) {
    return 'Akun ini telah dinonaktifkan. Hubungi Administrator Paroki.';
  }
  if (
    code.includes('auth/operation-not-allowed') ||
    code.includes('auth/configuration-not-found')
  ) {
    return 'Metode masuk Email/Password belum diaktifkan di Firebase Console. Aktifkan di Firebase Console → Authentication → Sign-in method → Email/Password.';
  }
  if (code.includes('auth/network-request-failed')) {
    return 'Gagal terhubung ke server autentikasi. Periksa koneksi internet Anda.';
  }
  return 'Gagal memproses autentikasi akun. Periksa username/email dan kata sandi Anda.';
}

const DRAFT_STORAGE_KEY = 'catevia_participant_draft_v1';

function formatTimestampLabel(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
  if (typeof value === 'string') return value;
  return new Date().toLocaleDateString('id-ID');
}

interface AppContextValue {
  // Authentication & RBAC
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  currentUser: FirebaseUser | null;
  currentUserProfile: SystemUser | null;
  actualRole: UserRole;
  role: UserRole;
  isPreviewingRole: boolean;
  isAccountDeactivated: boolean;
  fatalFirestoreError: string | null;
  setRole: (role: UserRole) => void;
  signInWithCredentials: (identifier: string, password: string) => Promise<void>;
  registerWithCredentials: (fullName: string, identifier: string, password: string) => Promise<void>;
  clearAuthError: () => void;
  signOut: () => Promise<void>;
  isSeedingData: boolean;

  // Navigation & Public Website Mode
  siteMode: SiteMode;
  setSiteMode: (mode: SiteMode) => void;
  openPublicWebsite: () => void;
  openLoginScreen: () => void;
  openPortal: () => void;
  startPublicRegistration: (preselectedProgram?: ProgramType) => void;
  isSubmittingFrontpageRegistration: boolean;
  lastFrontpageRegistrationResult: FrontpageRegistrationResult | null;
  clearFrontpageRegistrationResult: () => void;
  submitFrontpageRegistration: (
    data: FrontpageRegistrationPayload,
    pendingUploads?: PendingUploadFile[],
    accountCredentials?: {
      mode: 'register' | 'login';
      identifier: string;
      password: string;
    }
  ) => Promise<FrontpageRegistrationResult | null>;
  activePage: PageId;
  navigate: (page: PageId) => void;
  isPageLoading: boolean;
  triggerPageRefresh: () => void;

  // Public Website & CMS Data
  frontpageContent: FrontpageContent;
  publicPrograms: PublicProgram[];
  updateFrontpageContent: (next: FrontpageContent, options?: { silent?: boolean }) => Promise<void>;
  createPublicProgram: (data: Omit<PublicProgram, 'id' | 'updatedAt'>) => Promise<void>;
  updatePublicProgram: (id: string, updates: Omit<PublicProgram, 'id' | 'updatedAt'>) => Promise<void>;
  deletePublicProgram: (id: string) => Promise<void>;
  togglePublicProgramPublished: (id: string) => Promise<void>;
  reorderPublicProgram: (id: string, direction: 'up' | 'down') => Promise<void>;

  // Domain Data
  participants: Participant[];
  classes: CatechesisClass[];
  approvals: ApprovalRequest[];
  materials: StudyMaterial[];
  users: SystemUser[];
  notifications: AppNotification[];
  settings: ParishSettings;

  // Global UI Modals
  isRegistrationWizardOpen: boolean;
  wizardPreselectedProgram: ProgramType | null;
  openRegistrationWizard: (preselectedProgram?: ProgramType) => void;
  closeRegistrationWizard: () => void;
  isGlobalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  selectedParticipantIdFromSearch: string | null;
  clearSelectedParticipantFromSearch: () => void;
  jumpToParticipantDetail: (participantId: string) => void;

  // Draft Management
  participantDraft: ParticipantDraft | null;
  saveParticipantDraft: (draft: ParticipantDraft) => void;
  clearParticipantDraft: () => void;

  // Document Attachments
  loadParticipantAttachments: (participantId: string) => Promise<ParticipantAttachment[]>;
  uploadParticipantAttachment: (
    participantId: string,
    file: PendingUploadFile
  ) => Promise<ParticipantAttachment>;

  // CRUD Actions
  addParticipant: (
    data: Omit<Participant, 'id' | 'code' | 'registeredAt' | 'attendanceCount' | 'totalSessions'>,
    pendingUploads?: PendingUploadFile[]
  ) => Promise<void>;
  updateParticipant: (id: string, updates: Partial<Participant>) => Promise<void>;
  deleteParticipant: (id: string) => Promise<void>;
  bulkUpdateParticipantStatus: (ids: string[], status: ParticipantStatus) => Promise<void>;
  bulkDeleteParticipants: (ids: string[]) => Promise<void>;

  toggleSessionAttendance: (classId: string, sessionId: string, participantId: string) => Promise<void>;
  completeClassSession: (classId: string, sessionId: string) => Promise<void>;
  addClassSession: (classId: string, date: string, topic: string) => Promise<void>;

  submitApprovalRequest: (
    participantId: string,
    requestType: ApprovalRequest['requestType'],
    summaryNote: string
  ) => Promise<void>;
  decideApproval: (
    approvalId: string,
    decision: Exclude<ApprovalStatus, 'Menunggu'>,
    note: string
  ) => Promise<void>;

  toggleMaterialCompleted: (materialId: string) => Promise<void>;
  addMaterial: (material: Omit<StudyMaterial, 'id' | 'updatedAt'>) => Promise<void>;

  addUser: (user: Omit<SystemUser, 'id' | 'lastActive'> & { password?: string }) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  toggleUserActive: (userId: string) => Promise<void>;

  updateSettings: (nextSettings: ParishSettings, options?: { silent?: boolean }) => Promise<void>;

  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<SystemUser | null>(null);
  const [actualRole, setActualRole] = useState<UserRole>('general');
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);
  const [isAccountDeactivated, setIsAccountDeactivated] = useState(false);
  const [fatalFirestoreError, setFatalFirestoreError] = useState<string | null>(null);
  const [isSeedingData, setIsSeedingData] = useState(false);

  const [siteMode, setSiteMode] = useState<SiteMode>('public');
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [isPageLoading, setIsPageLoading] = useState(false);

  const [frontpageContent, setFrontpageContent] = useState<FrontpageContent>(
    DEFAULT_FRONTPAGE_CONTENT
  );
  const [frontpageLoaded, setFrontpageLoaded] = useState(false);
  const [publicPrograms, setPublicPrograms] = useState<PublicProgram[]>(DEFAULT_PUBLIC_PROGRAMS);
  const [programsLoaded, setProgramsLoaded] = useState(false);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoaded, setParticipantsLoaded] = useState(false);
  const [classes, setClasses] = useState<CatechesisClass[]>([]);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [rawMaterials, setRawMaterials] = useState<StudyMaterial[]>([]);
  const [materialProgressMap, setMaterialProgressMap] = useState<Record<string, boolean>>({});
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<ParishSettings>(INITIAL_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [isRegistrationWizardOpen, setIsRegistrationWizardOpen] = useState(false);
  const [wizardPreselectedProgram, setWizardPreselectedProgram] = useState<ProgramType | null>(null);
  const [pendingPublicRegistration, setPendingPublicRegistration] = useState<{
    program?: ProgramType;
  } | null>(null);
  const [pendingFrontpageSubmission, setPendingFrontpageSubmission] = useState<{
    data: FrontpageRegistrationPayload;
    pendingUploads: PendingUploadFile[];
  } | null>(null);
  const [isSubmittingFrontpageRegistration, setIsSubmittingFrontpageRegistration] = useState(false);
  const [lastFrontpageRegistrationResult, setLastFrontpageRegistrationResult] =
    useState<FrontpageRegistrationResult | null>(null);
  const [isGlobalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [selectedParticipantIdFromSearch, setSelectedParticipantIdFromSearch] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const seededOnceRef = useRef(false);
  const cmsSeededOnceRef = useRef(false);
  const lastAutoSyncSigRef = useRef<string>('');
  const cleanedProgramScheduleRef = useRef(false);
  const keepPublicOnSignInRef = useRef(false);

  const [participantDraft, setParticipantDraft] = useState<ParticipantDraft | null>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ParticipantDraft) : null;
    } catch {
      return null;
    }
  });

  // Effective role: Admins may preview other role layouts; non-admins strictly use their real Firestore role
  const role: UserRole = actualRole === 'admin' && previewRole ? previewRole : actualRole;
  const isPreviewingRole = actualRole === 'admin' && previewRole !== null && previewRole !== 'admin';

  const materials = useMemo(
    () =>
      rawMaterials.map((m) => ({
        ...m,
        completedByCurrentUser: Boolean(materialProgressMap[m.id]),
      })),
    [rawMaterials, materialProgressMap]
  );

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const navigate = useCallback((page: PageId) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setRole = useCallback(
    (nextRole: UserRole) => {
      if (actualRole !== 'admin') return;
      setPreviewRole(nextRole === 'admin' ? null : nextRole);
      if (!canAccessPage(nextRole, activePage)) {
        setActivePage('dashboard');
      }
      const meta = ROLE_PROFILES[nextRole];
      showToast({
        type: 'info',
        title: `Pratinjau tampilan: ${meta.label}`,
        description:
          nextRole === 'admin'
            ? 'Kembali ke tampilan penuh Administrator Paroki.'
            : 'Menampilkan antarmuka sesuai hak akses peran ini.',
      });
    },
    [activePage, actualRole, showToast]
  );

  const triggerPageRefresh = useCallback(() => {
    setIsPageLoading(true);
    window.setTimeout(() => setIsPageLoading(false), 260);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K (only active in authenticated portal view)
  useEffect(() => {
    if (!currentUser || isAccountDeactivated || siteMode !== 'portal') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser, isAccountDeactivated, siteMode]);

  // Seed default Public Frontpage CMS content & Public Programs if absent (runs for staff writers)
  const seedPublicCmsIfEmpty = useCallback(async () => {
    if (cmsSeededOnceRef.current) return;
    cmsSeededOnceRef.current = true;

    try {
      const fpSnap = await getDoc(doc(db, 'publicContent', 'frontpage'));
      if (!fpSnap.exists()) {
        let baseParishSettings = INITIAL_SETTINGS;
        const parishSnap = await getDoc(doc(db, 'settings', 'parish'));
        if (parishSnap.exists()) {
          const pd = parishSnap.data();
          baseParishSettings = {
            parishName: String(pd.parishName || INITIAL_SETTINGS.parishName),
            diocese: String(pd.diocese || INITIAL_SETTINGS.diocese),
            academicYear: String(pd.academicYear || INITIAL_SETTINGS.academicYear),
            minimumAttendancePercent: Number(pd.minimumAttendancePercent || 80),
            pastorName: String(pd.pastorName || INITIAL_SETTINGS.pastorName),
            coordinatorName: String(pd.coordinatorName || INITIAL_SETTINGS.coordinatorName),
            contactEmail: String(pd.contactEmail || INITIAL_SETTINGS.contactEmail),
            contactPhone: String(pd.contactPhone || INITIAL_SETTINGS.contactPhone),
            autoNotifyLingkungan: Boolean(pd.autoNotifyLingkungan),
            requireSponsorVerification: Boolean(pd.requireSponsorVerification),
          };
        }
        const initialSyncedFrontpage = syncFrontpageWithParishSettings(
          DEFAULT_FRONTPAGE_CONTENT,
          baseParishSettings
        );
        await setDoc(doc(db, 'publicContent', 'frontpage'), {
          ...initialSyncedFrontpage,
          updatedAt: serverTimestamp(),
        });
      }

      const progSnaps = await getDocs(collection(db, 'publicPrograms'));
      if (progSnaps.empty) {
        const batch = writeBatch(db);
        DEFAULT_PUBLIC_PROGRAMS.forEach((p) => {
          batch.set(doc(db, 'publicPrograms', p.id), {
            name: p.name,
            iconType: p.iconType,
            audience: p.audience,
            mode: p.mode,
            scheduleSummary: p.scheduleSummary,
            status: p.status,
            summary: p.summary,
            overview: p.overview,
            learnItems: p.learnItems,
            requirements: p.requirements,
            documents: p.documents,
            policyNote: p.policyNote,
            linkedProgram: p.linkedProgram,
            published: p.published,
            displayOrder: p.displayOrder,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
    } catch (error) {
      console.warn('Public CMS seed skipped or failed:', error);
    }
  }, []);

  // Seed initial Paroki Santo Yoseph dataset cleanly into Firestore on first Admin login
  const seedInitialFirestoreDataIfEmpty = useCallback(
    async (adminUser: FirebaseUser) => {
      if (seededOnceRef.current) return;
      seededOnceRef.current = true;

      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'parish'));
        if (settingsSnap.exists()) {
          return; // Database already seeded
        }

        setIsSeedingData(true);

        // 1. Seed Parish Settings
        await setDoc(doc(db, 'settings', 'parish'), {
          ...INITIAL_SETTINGS,
          updatedAt: serverTimestamp(),
        });

        // 2. Seed Classes FIRST (participants create rule verifies classId exists)
        const classBatch = writeBatch(db);
        INITIAL_CLASSES.forEach((cls) => {
          classBatch.set(doc(db, 'classes', cls.id), {
            code: cls.code,
            name: cls.name,
            program: cls.program,
            catechistName: cls.catechistName,
            scheduleDay: cls.scheduleDay,
            scheduleTime: cls.scheduleTime,
            room: cls.room,
            capacity: cls.capacity,
            status: cls.status,
            sessions: cls.sessions,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        await classBatch.commit();

        // 3. Seed Participants AFTER classes exist
        const participantBatch = writeBatch(db);
        INITIAL_PARTICIPANTS.forEach((p) => {
          const payload: Record<string, unknown> = {
            code: p.code,
            fullName: p.fullName,
            birthDate: p.birthDate,
            phone: p.phone,
            email: p.email,
            lingkungan: p.lingkungan,
            program: p.program,
            classId: p.classId,
            sponsorName: p.sponsorName,
            status: p.status,
            attendanceCount: p.attendanceCount,
            totalSessions: p.totalSessions,
            registeredAt: p.registeredAt,
            ownerUid: adminUser.uid,
            documents: p.documents,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (p.notes) payload.notes = p.notes;
          participantBatch.set(doc(db, 'participants', p.id), payload);
        });
        await participantBatch.commit();

        // 4. Seed Approvals AFTER participants exist
        const approvalBatch = writeBatch(db);
        INITIAL_APPROVALS.forEach((a) => {
          const payload: Record<string, unknown> = {
            code: a.code,
            participantId: a.participantId,
            participantName: a.participantName,
            program: a.program,
            lingkungan: a.lingkungan,
            requestType: a.requestType,
            submittedBy: a.submittedBy,
            submittedByUid: adminUser.uid,
            submittedAt: a.submittedAt,
            status: a.status,
            attendanceSummary: a.attendanceSummary,
            documentsComplete: a.documentsComplete,
            summaryNote: a.summaryNote,
            history: a.history,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (a.decisionNote) payload.decisionNote = a.decisionNote;
          if (a.decidedAt) payload.decidedAt = a.decidedAt;
          if (a.decidedBy) payload.decidedBy = a.decidedBy;
          approvalBatch.set(doc(db, 'approvals', a.id), payload);
        });
        await approvalBatch.commit();

        // 5. Seed Study Materials, Notifications, and Parish Team Directory
        const metaBatch = writeBatch(db);
        INITIAL_MATERIALS.forEach((m) => {
          metaBatch.set(doc(db, 'materials', m.id), {
            title: m.title,
            program: m.program,
            sessionNumber: m.sessionNumber,
            durationMinutes: m.durationMinutes,
            author: m.author,
            updatedAt: m.updatedAt,
            summary: m.summary,
            keyPoints: m.keyPoints,
            createdAt: serverTimestamp(),
          });
        });
        INITIAL_NOTIFICATIONS.forEach((n) => {
          metaBatch.set(doc(db, 'notifications', n.id), {
            title: n.title,
            description: n.description,
            timeLabel: n.timeLabel,
            read: n.read,
            targetPage: n.targetPage,
            roles: n.roles,
            createdAt: serverTimestamp(),
          });
        });
        INITIAL_USERS.filter((u) => u.email !== adminUser.email).forEach((u) => {
          metaBatch.set(doc(db, 'users', u.id), {
            uid: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            lingkungan: u.lingkungan,
            active: u.active,
            lastActive: u.lastActive,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        await metaBatch.commit();

        showToast({
          type: 'success',
          title: 'Basis data Paroki siap digunakan',
          description: 'Data awal katekese paroki telah tersimpan ke Firestore.',
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'seed');
      } finally {
        setIsSeedingData(false);
      }
    },
    [showToast]
  );

  // Firebase Auth state listener & user profile bootstrap
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setCurrentUser(null);
        setCurrentUserProfile(null);
        setActualRole('general');
        setPreviewRole(null);
        setIsAccountDeactivated(false);
        setFatalFirestoreError(null);
        setParticipants([]);
        setParticipantsLoaded(false);
        setClasses([]);
        setClassesLoaded(false);
        setApprovals([]);
        setRawMaterials([]);
        setUsers([]);
        setNotifications([]);
        setLastFrontpageRegistrationResult(null);
        setSiteMode((prev) => (prev === 'login' ? 'login' : 'public'));
        setAuthReady(true);
        return;
      }

      setCurrentUser(fbUser);
      const userDocRef = doc(db, 'users', fbUser.uid);

      try {
        const snap = await getDoc(userDocRef);
        const normalizedEmail = (fbUser.email || '').trim().toLowerCase();
        const isBootstrappedAdmin =
          normalizedEmail === ADMIN_LOGIN_EMAIL ||
          (fbUser.emailVerified && normalizedEmail === BOOTSTRAPPED_ADMIN_EMAIL);

        let resolvedRole: UserRole = isBootstrappedAdmin ? 'admin' : 'general';
        let profileData: SystemUser;

        if (!snap.exists()) {
          const displayName = (fbUser.displayName || fbUser.email?.split('@')[0] || 'Pengguna Catevia').slice(
            0,
            120
          );
          const email = (fbUser.email || 'umat@paroki.or.id').slice(0, 160);
          const newProfilePayload = {
            uid: fbUser.uid,
            name: displayName,
            email,
            role: resolvedRole,
            lingkungan: isBootstrappedAdmin ? 'Sekretariat Paroki' : 'St. Lukas',
            active: true,
            lastActive: 'Aktif sekarang',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userDocRef, newProfilePayload);
          profileData = {
            id: fbUser.uid,
            uid: fbUser.uid,
            name: displayName,
            email,
            role: resolvedRole,
            lingkungan: newProfilePayload.lingkungan,
            active: true,
            lastActive: 'Aktif sekarang',
          };
        } else {
          const data = snap.data();
          resolvedRole = isBootstrappedAdmin
            ? 'admin'
            : ((data.role as UserRole) || 'general');
          profileData = {
            id: snap.id,
            uid: String(data.uid || snap.id),
            name: String(data.name || fbUser.displayName || 'Pengguna'),
            email: String(data.email || fbUser.email || ''),
            role: resolvedRole,
            lingkungan: String(data.lingkungan || 'St. Lukas'),
            active: Boolean(data.active ?? true),
            lastActive: 'Aktif sekarang',
          };
          await updateDoc(userDocRef, {
            lastActive: 'Aktif sekarang',
            updatedAt: serverTimestamp(),
          }).catch(() => {
            // Non-critical lastActive update
          });
        }

        const deactivated = !profileData.active && !isBootstrappedAdmin;
        setCurrentUserProfile(profileData);
        setIsAccountDeactivated(deactivated);
        setActualRole(deactivated ? 'general' : resolvedRole);
        setFatalFirestoreError(null);
        if (keepPublicOnSignInRef.current) {
          keepPublicOnSignInRef.current = false;
        } else {
          setSiteMode('portal');
        }

        if (!deactivated && resolvedRole === 'admin') {
          await seedInitialFirestoreDataIfEmpty(fbUser);
        }
        if (!deactivated && (resolvedRole === 'admin' || resolvedRole === 'operational')) {
          await seedPublicCmsIfEmpty();
        }
      } catch (error) {
        console.error('Failed to bootstrap user profile:', error);
        setAuthError(
          'Gagal memuat profil pengguna dari server. Pastikan akun Anda aktif dan aturan basis data sudah diterapkan.'
        );
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [seedInitialFirestoreDataIfEmpty, seedPublicCmsIfEmpty]);

  // Public Firestore subscriptions (accessible without login for the Public Frontpage Website)
  useEffect(() => {
    const canViewDrafts =
      Boolean(currentUser) &&
      !isAccountDeactivated &&
      (actualRole === 'admin' || actualRole === 'operational');

    const unsubFrontpage = onSnapshot(
      doc(db, 'publicContent', 'frontpage'),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        setFrontpageLoaded(true);
        setFrontpageContent({
          parishLabel: String(d.parishLabel ?? DEFAULT_FRONTPAGE_CONTENT.parishLabel),
          heroTitle: String(d.heroTitle ?? DEFAULT_FRONTPAGE_CONTENT.heroTitle),
          heroSubtitle: String(d.heroSubtitle ?? DEFAULT_FRONTPAGE_CONTENT.heroSubtitle),
          heroPrimaryCtaLabel: String(
            d.heroPrimaryCtaLabel ?? DEFAULT_FRONTPAGE_CONTENT.heroPrimaryCtaLabel
          ),
          heroSecondaryCtaLabel: String(
            d.heroSecondaryCtaLabel ?? DEFAULT_FRONTPAGE_CONTENT.heroSecondaryCtaLabel
          ),
          showScriptureSection: Boolean(
            d.showScriptureSection ?? DEFAULT_FRONTPAGE_CONTENT.showScriptureSection
          ),
          scriptureHeading: String(d.scriptureHeading ?? DEFAULT_FRONTPAGE_CONTENT.scriptureHeading),
          scriptureQuote: String(d.scriptureQuote ?? DEFAULT_FRONTPAGE_CONTENT.scriptureQuote),
          scriptureSource: String(d.scriptureSource ?? DEFAULT_FRONTPAGE_CONTENT.scriptureSource),
          scriptureNote: String(d.scriptureNote ?? DEFAULT_FRONTPAGE_CONTENT.scriptureNote),
          programsEyebrow: String(d.programsEyebrow ?? DEFAULT_FRONTPAGE_CONTENT.programsEyebrow),
          programsHeading: String(d.programsHeading ?? DEFAULT_FRONTPAGE_CONTENT.programsHeading),
          programsSubtitle: String(d.programsSubtitle ?? DEFAULT_FRONTPAGE_CONTENT.programsSubtitle),
          showRolesSection: Boolean(
            d.showRolesSection ?? DEFAULT_FRONTPAGE_CONTENT.showRolesSection
          ),
          rolesHeading: String(d.rolesHeading ?? DEFAULT_FRONTPAGE_CONTENT.rolesHeading),
          rolesSubtitle: String(d.rolesSubtitle ?? DEFAULT_FRONTPAGE_CONTENT.rolesSubtitle),
          roleHighlights: Array.isArray(d.roleHighlights)
            ? d.roleHighlights
            : DEFAULT_FRONTPAGE_CONTENT.roleHighlights,
          aboutTitle: String(d.aboutTitle ?? DEFAULT_FRONTPAGE_CONTENT.aboutTitle),
          aboutContent: String(d.aboutContent ?? DEFAULT_FRONTPAGE_CONTENT.aboutContent),
          aboutHighlights: Array.isArray(d.aboutHighlights)
            ? d.aboutHighlights.map(String)
            : DEFAULT_FRONTPAGE_CONTENT.aboutHighlights,
          guideTitle: String(d.guideTitle ?? DEFAULT_FRONTPAGE_CONTENT.guideTitle),
          guideIntro: String(d.guideIntro ?? DEFAULT_FRONTPAGE_CONTENT.guideIntro),
          guideSteps: Array.isArray(d.guideSteps)
            ? d.guideSteps
            : DEFAULT_FRONTPAGE_CONTENT.guideSteps,
          showFaqSection: Boolean(d.showFaqSection ?? DEFAULT_FRONTPAGE_CONTENT.showFaqSection),
          faqs: Array.isArray(d.faqs) ? d.faqs : DEFAULT_FRONTPAGE_CONTENT.faqs,
          contactTitle: String(d.contactTitle ?? DEFAULT_FRONTPAGE_CONTENT.contactTitle),
          contactDescription: String(
            d.contactDescription ?? DEFAULT_FRONTPAGE_CONTENT.contactDescription
          ),
          contactAddress: String(d.contactAddress ?? DEFAULT_FRONTPAGE_CONTENT.contactAddress),
          contactHours: String(d.contactHours ?? DEFAULT_FRONTPAGE_CONTENT.contactHours),
          contactEmail: String(d.contactEmail ?? DEFAULT_FRONTPAGE_CONTENT.contactEmail),
          contactPhone: String(d.contactPhone ?? DEFAULT_FRONTPAGE_CONTENT.contactPhone),
          footerTagline: String(d.footerTagline ?? DEFAULT_FRONTPAGE_CONTENT.footerTagline),
          footerCopyright: String(d.footerCopyright ?? DEFAULT_FRONTPAGE_CONTENT.footerCopyright),
        });
      },
      (err) => {
        console.warn('Public frontpage snapshot fallback to defaults:', err);
      }
    );

    const programsQuery = canViewDrafts
      ? collection(db, 'publicPrograms')
      : query(collection(db, 'publicPrograms'), where('published', '==', true));

    const unsubPrograms = onSnapshot(
      programsQuery,
      (snapshot) => {
        if (snapshot.empty && !canViewDrafts) {
          setPublicPrograms(DEFAULT_PUBLIC_PROGRAMS);
          return;
        }
        const items: PublicProgram[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: String(data.name || ''),
            iconType: (data.iconType as PublicProgramIconType) || 'umum',
            audience: String(data.audience || ''),
            mode: String(data.mode || ''),
            scheduleSummary: String(data.scheduleSummary || ''),
            status: (data.status as PublicProgramStatus) || 'Pendaftaran Dibuka',
            summary: String(data.summary || ''),
            overview: String(data.overview || ''),
            learnItems: Array.isArray(data.learnItems) ? data.learnItems.map(String) : [],
            requirements: Array.isArray(data.requirements) ? data.requirements.map(String) : [],
            documents: Array.isArray(data.documents) ? data.documents.map(String) : [],
            policyNote: String(data.policyNote || ''),
            linkedProgram: (data.linkedProgram as ProgramType | '') || '',
            published: Boolean(data.published ?? true),
            displayOrder: Number(data.displayOrder ?? 0),
            updatedAt: formatTimestampLabel(data.updatedAt),
          };
        });
        items.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
        setPublicPrograms(items);
        setProgramsLoaded(true);
      },
      (err) => {
        console.warn('Public programs snapshot fallback to defaults:', err);
      }
    );

    return () => {
      unsubFrontpage();
      unsubPrograms();
    };
  }, [currentUser, actualRole, isAccountDeactivated]);

  // Real-time Firestore subscriptions (strictly gated on authReady && currentUser && active account)
  useEffect(() => {
    if (!authReady || !currentUser || isAccountDeactivated) return;

    const reportSnapshotError = (err: unknown, op: OperationType, path: string) => {
      try {
        handleFirestoreError(err, op, path);
      } catch (wrapped) {
        setFatalFirestoreError(wrapped instanceof Error ? wrapped.message : String(wrapped));
      }
    };

    const unsubscribers: (() => void)[] = [];
    const isStaff =
      actualRole === 'admin' || actualRole === 'operational' || actualRole === 'approver';

    // 1. Parish Settings
    unsubscribers.push(
      onSnapshot(
        doc(db, 'settings', 'parish'),
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setSettings({
              parishName: String(d.parishName || INITIAL_SETTINGS.parishName),
              diocese: String(d.diocese || INITIAL_SETTINGS.diocese),
              academicYear: String(d.academicYear || INITIAL_SETTINGS.academicYear),
              minimumAttendancePercent: Number(d.minimumAttendancePercent || 80),
              pastorName: String(d.pastorName || INITIAL_SETTINGS.pastorName),
              coordinatorName: String(d.coordinatorName || INITIAL_SETTINGS.coordinatorName),
              contactEmail: String(d.contactEmail || INITIAL_SETTINGS.contactEmail),
              contactPhone: String(d.contactPhone || INITIAL_SETTINGS.contactPhone),
              autoNotifyLingkungan: Boolean(d.autoNotifyLingkungan),
              requireSponsorVerification: Boolean(d.requireSponsorVerification),
            });
            setSettingsLoaded(true);
          }
        },
        (err) => reportSnapshotError(err, OperationType.GET, 'settings/parish')
      )
    );

    // 2. Classes
    const classesQuery = query(
      collection(db, 'classes'),
      where('status', 'in', ['Aktif', 'Selesai', 'Dijadwalkan'])
    );
    unsubscribers.push(
      onSnapshot(
        classesQuery,
        (snapshot) => {
          const items: CatechesisClass[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              code: String(data.code || ''),
              name: String(data.name || ''),
              program: data.program as CatechesisClass['program'],
              catechistName: String(data.catechistName || ''),
              scheduleDay: String(data.scheduleDay || ''),
              scheduleTime: String(data.scheduleTime || ''),
              room: String(data.room || ''),
              capacity: Number(data.capacity || 20),
              status: (data.status as CatechesisClass['status']) || 'Aktif',
              sessions: Array.isArray(data.sessions) ? data.sessions : [],
            };
          });
          items.sort((a, b) => a.code.localeCompare(b.code));
          setClasses(items);
          setClassesLoaded(true);
        },
        (err) => reportSnapshotError(err, OperationType.LIST, 'classes')
      )
    );

    // 3. Participants (staff sees all; general user strictly queries own ownerUid)
    const participantsRef = isStaff
      ? collection(db, 'participants')
      : query(collection(db, 'participants'), where('ownerUid', '==', currentUser.uid));

    unsubscribers.push(
      onSnapshot(
        participantsRef,
        (snapshot) => {
          const items: Participant[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              code: String(data.code || ''),
              fullName: String(data.fullName || ''),
              birthDate: String(data.birthDate || ''),
              phone: String(data.phone || ''),
              email: String(data.email || '-'),
              lingkungan: String(data.lingkungan || ''),
              program: data.program as Participant['program'],
              classId: String(data.classId || ''),
              sponsorName: String(data.sponsorName || ''),
              status: data.status as ParticipantStatus,
              attendanceCount: Number(data.attendanceCount || 0),
              totalSessions: Number(data.totalSessions || 12),
              registeredAt: String(data.registeredAt || ''),
              ownerUid: String(data.ownerUid || ''),
              documents: {
                ktpKk: Boolean(data.documents?.ktpKk),
                suratBaptisAtauRekomendasi: Boolean(data.documents?.suratBaptisAtauRekomendasi),
                pasFoto: Boolean(data.documents?.pasFoto),
              },
              notes: data.notes ? String(data.notes) : undefined,
            };
          });
          items.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
          setParticipants(items);
          setParticipantsLoaded(true);
        },
        (err) => reportSnapshotError(err, OperationType.LIST, 'participants')
      )
    );

    // 4. Study Materials
    const materialsQuery = query(collection(db, 'materials'), where('sessionNumber', '>=', 1));
    unsubscribers.push(
      onSnapshot(
        materialsQuery,
        (snapshot) => {
          const items: StudyMaterial[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: String(data.title || ''),
              program: data.program as StudyMaterial['program'],
              sessionNumber: Number(data.sessionNumber || 1),
              durationMinutes: Number(data.durationMinutes || 30),
              author: String(data.author || ''),
              updatedAt: String(data.updatedAt || ''),
              summary: String(data.summary || ''),
              keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints.map(String) : [],
            };
          });
          items.sort((a, b) => a.sessionNumber - b.sessionNumber);
          setRawMaterials(items);
        },
        (err) => reportSnapshotError(err, OperationType.LIST, 'materials')
      )
    );

    // 5. User's Material Reading Progress
    unsubscribers.push(
      onSnapshot(
        collection(db, 'users', currentUser.uid, 'progress'),
        (snapshot) => {
          const nextMap: Record<string, boolean> = {};
          snapshot.docs.forEach((d) => {
            nextMap[d.id] = Boolean(d.data().completed);
          });
          setMaterialProgressMap(nextMap);
        },
        (err) =>
          reportSnapshotError(err, OperationType.LIST, `users/${currentUser.uid}/progress`)
      )
    );

    // 6. Notifications
    const notifRef = isStaff
      ? collection(db, 'notifications')
      : query(collection(db, 'notifications'), where('roles', 'array-contains', 'general'));

    unsubscribers.push(
      onSnapshot(
        notifRef,
        (snapshot) => {
          const items: AppNotification[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: String(data.title || ''),
              description: String(data.description || ''),
              timeLabel: String(data.timeLabel || ''),
              read: Boolean(data.read),
              targetPage: (data.targetPage as PageId) || 'dashboard',
              roles: Array.isArray(data.roles) ? (data.roles as UserRole[]) : ['admin'],
              recipientUid: data.recipientUid ? String(data.recipientUid) : undefined,
            };
          });
          setNotifications(items);
        },
        (err) => reportSnapshotError(err, OperationType.LIST, 'notifications')
      )
    );

    // 7. Approvals (Staff only)
    if (isStaff) {
      unsubscribers.push(
        onSnapshot(
          collection(db, 'approvals'),
          (snapshot) => {
            const items: ApprovalRequest[] = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                code: String(data.code || ''),
                participantId: String(data.participantId || ''),
                participantName: String(data.participantName || ''),
                program: data.program as ApprovalRequest['program'],
                lingkungan: String(data.lingkungan || ''),
                requestType: data.requestType as ApprovalRequest['requestType'],
                submittedBy: String(data.submittedBy || ''),
                submittedByUid: data.submittedByUid ? String(data.submittedByUid) : undefined,
                submittedAt: String(data.submittedAt || ''),
                status: data.status as ApprovalStatus,
                attendanceSummary: String(data.attendanceSummary || ''),
                documentsComplete: Boolean(data.documentsComplete),
                summaryNote: String(data.summaryNote || ''),
                decisionNote: data.decisionNote ? String(data.decisionNote) : undefined,
                decidedAt: data.decidedAt ? String(data.decidedAt) : undefined,
                decidedBy: data.decidedBy ? String(data.decidedBy) : undefined,
                history: Array.isArray(data.history) ? data.history : [],
              };
            });
            items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
            setApprovals(items);
          },
          (err) => reportSnapshotError(err, OperationType.LIST, 'approvals')
        )
      );
    } else {
      setApprovals([]);
    }

    // 8. System Users Directory (Admin only)
    if (actualRole === 'admin') {
      unsubscribers.push(
        onSnapshot(
          collection(db, 'users'),
          (snapshot) => {
            const items: SystemUser[] = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                uid: String(data.uid || d.id),
                name: String(data.name || ''),
                email: String(data.email || ''),
                role: (data.role as UserRole) || 'general',
                lingkungan: String(data.lingkungan || ''),
                active: Boolean(data.active ?? true),
                lastActive: String(data.lastActive || '-'),
              };
            });
            items.sort((a, b) => a.name.localeCompare(b.name));
            setUsers(items);
          },
          (err) => reportSnapshotError(err, OperationType.LIST, 'users')
        )
      );
    } else {
      setUsers([]);
    }

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [authReady, currentUser, actualRole, isAccountDeactivated]);

  // Auth Actions (Username/Email & Password via Firebase Auth)
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const signInWithCredentials = useCallback(async (identifier: string, password: string) => {
    setAuthError(null);
    if (!isValidLoginIdentifier(identifier)) {
      setAuthError('Masukkan username (min. 3 karakter) atau alamat email yang valid.');
      return;
    }
    if (!password || password.length < 6) {
      setAuthError('Masukkan kata sandi akun Anda (minimal 6 karakter).');
      return;
    }

    const resolvedEmail = resolveLoginEmail(identifier);
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, resolvedEmail, password);
    } catch (error) {
      setAuthError(formatFirebaseAuthError(error));
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const registerWithCredentials = useCallback(
    async (fullName: string, identifier: string, password: string) => {
      setAuthError(null);
      const trimmedName = fullName.trim();
      if (trimmedName.length < 3) {
        setAuthError('Masukkan nama lengkap minimal 3 karakter.');
        return;
      }
      if (!isValidLoginIdentifier(identifier)) {
        setAuthError('Masukkan username (huruf/angka, min. 3 karakter) atau alamat email yang valid.');
        return;
      }
      if (isReservedUsername(identifier)) {
        setAuthError(
          'Username tersebut khusus untuk akun pengurus paroki. Gunakan username atau email lain.'
        );
        return;
      }
      if (password.length < 8) {
        setAuthError('Kata sandi minimal 8 karakter agar akun Anda aman.');
        return;
      }

      const resolvedEmail = resolveLoginEmail(identifier);
      setAuthLoading(true);
      try {
        const credential = await createUserWithEmailAndPassword(auth, resolvedEmail, password);
        await updateProfile(credential.user, {
          displayName: trimmedName.slice(0, 120),
        }).catch(() => {
          // Non-critical displayName update
        });
      } catch (error) {
        setAuthError(formatFirebaseAuthError(error));
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setPreviewRole(null);
    setParticipantsLoaded(false);
    setClassesLoaded(false);
    setPendingPublicRegistration(null);
    setPendingFrontpageSubmission(null);
    setLastFrontpageRegistrationResult(null);
    setWizardPreselectedProgram(null);
    setIsRegistrationWizardOpen(false);
    setActivePage('dashboard');
    setSiteMode('public');
    showToast({ type: 'info', title: 'Anda telah keluar dari Catevia' });
  }, [showToast]);

  const openPublicWebsite = useCallback(() => {
    setSiteMode('public');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openLoginScreen = useCallback(() => {
    setSiteMode('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openPortal = useCallback(() => {
    if (currentUser) {
      setSiteMode('portal');
    } else {
      setSiteMode('login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentUser]);

  const openRegistrationWizard = useCallback((preselectedProgram?: ProgramType) => {
    setWizardPreselectedProgram(preselectedProgram ?? null);
    setIsRegistrationWizardOpen(true);
  }, []);

  const closeRegistrationWizard = useCallback(() => {
    setIsRegistrationWizardOpen(false);
    setWizardPreselectedProgram(null);
  }, []);

  const startPublicRegistration = useCallback(
    (preselectedProgram?: ProgramType) => {
      setPendingPublicRegistration({ program: preselectedProgram });
      openLoginScreen();
    },
    [openLoginScreen]
  );

  // Fulfill pending public registration intent right after Google sign-in and participant data load
  useEffect(() => {
    if (
      !pendingPublicRegistration ||
      !authReady ||
      !currentUser ||
      isAccountDeactivated ||
      isSeedingData ||
      !participantsLoaded
    ) {
      return;
    }

    const intent = pendingPublicRegistration;
    setPendingPublicRegistration(null);
    setSiteMode('portal');

    if (actualRole === 'admin' || actualRole === 'operational') {
      openRegistrationWizard(intent.program);
      return;
    }

    if (actualRole === 'approver') {
      setActivePage('approvals');
      showToast({
        type: 'info',
        title: 'Masuk sebagai Pastor Paroki',
        description: 'Antrean persetujuan peserta siap ditinjau.',
      });
      return;
    }

    // General user (Peserta / Umat)
    const alreadyRegistered = participants.some((p) => p.ownerUid === currentUser.uid);
    if (!alreadyRegistered) {
      setActivePage('dashboard');
      openRegistrationWizard(intent.program);
    } else {
      setActivePage('dashboard');
      showToast({
        type: 'info',
        title: 'Anda sudah terdaftar di program katekese',
        description: 'Pantau jadwal pertemuan dan kelengkapan berkas Anda di Beranda.',
      });
    }
  }, [
    actualRole,
    authReady,
    currentUser,
    isAccountDeactivated,
    isSeedingData,
    openRegistrationWizard,
    participants,
    participantsLoaded,
    pendingPublicRegistration,
    showToast,
  ]);

  // Draft Management
  const saveParticipantDraft = useCallback(
    (draft: ParticipantDraft) => {
      setParticipantDraft(draft);
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch {
        // Ignore storage errors
      }
      showToast({
        type: 'info',
        title: 'Draf pendaftaran tersimpan',
        description: 'Anda dapat melanjutkan pengisian formulir kapan saja.',
      });
    },
    [showToast]
  );

  const clearParticipantDraft = useCallback(() => {
    setParticipantDraft(null);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Attachments CRUD
  const loadParticipantAttachments = useCallback(
    async (participantId: string): Promise<ParticipantAttachment[]> => {
      const path = `participants/${participantId}/attachments`;
      try {
        const snap = await getDocs(collection(db, 'participants', participantId, 'attachments'));
        return snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            participantId: String(data.participantId || participantId),
            docType: data.docType as ParticipantAttachment['docType'],
            fileName: String(data.fileName || ''),
            mimeType: data.mimeType as ParticipantAttachment['mimeType'],
            fileSizeBytes: Number(data.fileSizeBytes || 0),
            previewDataUrl: data.previewDataUrl ? String(data.previewDataUrl) : undefined,
            uploadedByUid: String(data.uploadedByUid || ''),
            uploadedByName: String(data.uploadedByName || ''),
            uploadedAt: formatTimestampLabel(data.uploadedAt),
          };
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    },
    []
  );

  const uploadParticipantAttachment = useCallback(
    async (participantId: string, file: PendingUploadFile): Promise<ParticipantAttachment> => {
      if (!currentUser) throw new Error('Pengguna belum masuk.');
      const path = `participants/${participantId}/attachments/${file.docType}`;
      const uploaderName = (
        currentUserProfile?.name ||
        currentUser.displayName ||
        ROLE_PROFILES[role].personName
      ).slice(0, 120);

      try {
        const attachmentPayload: Record<string, unknown> = {
          participantId,
          docType: file.docType,
          fileName: file.fileName.slice(0, 160),
          mimeType: file.mimeType,
          fileSizeBytes: Math.max(1, Math.round(file.fileSizeBytes)),
          uploadedByUid: currentUser.uid,
          uploadedByName: uploaderName,
          uploadedAt: serverTimestamp(),
        };
        if (file.previewDataUrl) {
          attachmentPayload.previewDataUrl = file.previewDataUrl;
        }

        await setDoc(
          doc(db, 'participants', participantId, 'attachments', file.docType),
          attachmentPayload
        );

        // Also update participant's documents checklist flag
        const target = participants.find((p) => p.id === participantId);
        if (target) {
          const updatedDocs = { ...target.documents, [file.docType]: true };
          const allDocsReady =
            updatedDocs.ktpKk && updatedDocs.suratBaptisAtauRekomendasi && updatedDocs.pasFoto;
          const shouldReopenVerification =
            role === 'general' &&
            allDocsReady &&
            (target.status === 'Perlu Revisi' || target.status === 'Menunggu Verifikasi');
          await updateDoc(doc(db, 'participants', participantId), {
            documents: updatedDocs,
            ...(shouldReopenVerification ? { status: 'Menunggu Verifikasi' } : {}),
            updatedAt: serverTimestamp(),
          });
        }

        showToast({
          type: 'success',
          title: 'Berkas berhasil diunggah',
          description: `${file.fileName} tersimpan dan dapat ditinjau oleh katekis serta Pastor Paroki.`,
        });

        return {
          id: file.docType,
          participantId,
          docType: file.docType,
          fileName: file.fileName,
          mimeType: file.mimeType,
          fileSizeBytes: file.fileSizeBytes,
          previewDataUrl: file.previewDataUrl,
          uploadedByUid: currentUser.uid,
          uploadedByName: uploaderName,
          uploadedAt: new Date().toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        };
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [currentUser, currentUserProfile, participants, role, showToast]
  );

  // Participants CRUD
  const addParticipant = useCallback(
    async (
      data: Omit<Participant, 'id' | 'code' | 'registeredAt' | 'attendanceCount' | 'totalSessions'>,
      pendingUploads: PendingUploadFile[] = []
    ) => {
      if (!currentUser) return;
      const participantId = `p-${Date.now()}`;
      const isSelfRegistration = actualRole === 'general' || role === 'general';
      const nextNum = 2601 + participants.length + 1;
      const code = isSelfRegistration
        ? `CTV-26-${String(Date.now()).slice(-4)}`
        : `CTV-${nextNum}`;
      const registeredAt = new Date().toISOString().slice(0, 10);

      const effectiveStatus: ParticipantStatus = isSelfRegistration
        ? 'Menunggu Verifikasi'
        : data.status;

      const docsFlags = { ...data.documents };
      pendingUploads.forEach((f) => {
        docsFlags[f.docType] = true;
      });

      const payload: Record<string, unknown> = {
        code,
        fullName: data.fullName.trim().slice(0, 120),
        birthDate: data.birthDate,
        phone: data.phone.trim().slice(0, 30),
        email: (data.email || '-').trim().slice(0, 160),
        lingkungan: data.lingkungan.slice(0, 80),
        program: data.program,
        classId: data.classId,
        sponsorName: data.sponsorName.trim().slice(0, 120),
        status: effectiveStatus,
        attendanceCount: 0,
        totalSessions: 12,
        registeredAt,
        ownerUid: currentUser.uid,
        documents: docsFlags,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (data.notes && data.notes.trim()) {
        payload.notes = data.notes.trim().slice(0, 600);
      }

      try {
        await setDoc(doc(db, 'participants', participantId), payload);

        // Save attached files if provided in Step 3
        for (const upload of pendingUploads) {
          await uploadParticipantAttachment(participantId, upload);
        }

        // Auto-create approval request & approver notification when submitted for verification by staff
        if (
          effectiveStatus === 'Menunggu Verifikasi' &&
          !isSelfRegistration &&
          (actualRole === 'admin' || actualRole === 'operational')
        ) {
          const approvalId = `apr-${Date.now()}`;
          const notifId = `ntf-${Date.now()}`;
          const docsComplete =
            docsFlags.ktpKk && docsFlags.suratBaptisAtauRekomendasi && docsFlags.pasFoto;
          const actorName = (
            currentUserProfile?.name ||
            currentUser.displayName ||
            ROLE_PROFILES[role].personName
          ).slice(0, 120);

          const batch = writeBatch(db);
          batch.set(doc(db, 'approvals', approvalId), {
            code: `VER-2026-0${approvals.length + 18}`,
            participantId,
            participantName: payload.fullName,
            program: data.program,
            lingkungan: data.lingkungan,
            requestType: 'Verifikasi Berkas Pendaftaran',
            submittedBy: actorName,
            submittedByUid: currentUser.uid,
            submittedAt: registeredAt,
            status: 'Menunggu',
            attendanceSummary: '0 dari 12 pertemuan (Pendaftaran Baru)',
            documentsComplete: docsComplete,
            summaryNote:
              data.notes?.trim() || 'Pendaftaran peserta baru diajukan untuk verifikasi berkas.',
            history: [
              {
                id: `h-${Date.now()}`,
                date: new Date().toLocaleString('id-ID', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }),
                actorName,
                actorRole: ROLE_PROFILES[role].personTitle,
                action: 'Mengajukan Verifikasi',
                note: 'Data peserta baru didaftarkan melalui formulir pendaftaran.',
              },
            ],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          batch.set(doc(db, 'notifications', notifId), {
            title: `Verifikasi pendaftaran baru: ${String(payload.fullName)}`.slice(0, 160),
            description:
              `${actorName} mendaftarkan ${String(payload.fullName)} (${data.program}) untuk verifikasi berkas.`.slice(
                0,
                400
              ),
            timeLabel: 'Baru saja',
            read: false,
            targetPage: 'approvals',
            roles: ['admin', 'approver'],
            createdAt: serverTimestamp(),
          });
          await batch.commit();
        }

        clearParticipantDraft();
        showToast({
          type: 'success',
          title: isSelfRegistration
            ? 'Pendaftaran Anda berhasil dikirim'
            : 'Peserta berhasil didaftarkan',
          description: isSelfRegistration
            ? `Nomor registrasi ${code} tercatat dengan status Menunggu Verifikasi Sekretariat Paroki.`
            : `${data.fullName} (${code}) tersimpan di basis data Firestore.`,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `participants/${participantId}`);
      }
    },
    [
      actualRole,
      approvals.length,
      clearParticipantDraft,
      currentUser,
      currentUserProfile,
      participants.length,
      role,
      showToast,
      uploadParticipantAttachment,
    ]
  );

  // Direct Frontpage Self-Registration (works both when already signed in and via in-place Google verification)
  const executeFrontpageRegistration = useCallback(
    async (
      fbUser: FirebaseUser,
      data: FrontpageRegistrationPayload,
      pendingUploads: PendingUploadFile[] = []
    ): Promise<FrontpageRegistrationResult | null> => {
      const targetClass =
        classes.find((c) => c.id === data.classId) ||
        classes.find((c) => c.program === data.program) ||
        classes[0];

      if (!targetClass) {
        showToast({
          type: 'error',
          title: 'Kelas pembinaan belum tersedia',
          description:
            'Sekretariat Paroki belum membuka kelas aktif untuk program ini. Silakan hubungi Sekretariat.',
        });
        return null;
      }

      const participantId = `p-${Date.now()}`;
      const code = `CTV-26-${String(Date.now()).slice(-4)}`;
      const registeredAt = new Date().toISOString().slice(0, 10);
      const docsFlags = { ...data.documents };
      pendingUploads.forEach((f) => {
        docsFlags[f.docType] = true;
      });

      const payload: Record<string, unknown> = {
        code,
        fullName: data.fullName.trim().slice(0, 120),
        birthDate: data.birthDate,
        phone: data.phone.trim().slice(0, 30),
        email: (data.email.trim() || fbUser.email || '-').slice(0, 160),
        lingkungan: data.lingkungan.trim().slice(0, 80),
        program: data.program,
        classId: targetClass.id,
        sponsorName: data.sponsorName.trim().slice(0, 120),
        status: 'Menunggu Verifikasi',
        attendanceCount: 0,
        totalSessions: 12,
        registeredAt,
        ownerUid: fbUser.uid,
        documents: docsFlags,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (data.notes && data.notes.trim()) {
        payload.notes = data.notes.trim().slice(0, 600);
      }

      setIsSubmittingFrontpageRegistration(true);
      try {
        await setDoc(doc(db, 'participants', participantId), payload);

        for (const upload of pendingUploads) {
          await uploadParticipantAttachment(participantId, upload);
        }

        const result: FrontpageRegistrationResult = {
          participantId,
          code,
          fullName: String(payload.fullName),
          program: data.program,
          className: targetClass.name,
          lingkungan: String(payload.lingkungan),
          registeredAt,
          status: 'Menunggu Verifikasi',
        };
        setLastFrontpageRegistrationResult(result);
        clearParticipantDraft();
        showToast({
          type: 'success',
          title: 'Pendaftaran katekese berhasil dikirim',
          description: `Nomor registrasi Anda ${code}. Sekretariat Paroki akan memeriksa kelengkapan berkas Anda.`,
        });
        return result;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `participants/${participantId}`);
        return null;
      } finally {
        setIsSubmittingFrontpageRegistration(false);
      }
    },
    [classes, clearParticipantDraft, showToast, uploadParticipantAttachment]
  );

  const submitFrontpageRegistration = useCallback(
    async (
      data: FrontpageRegistrationPayload,
      pendingUploads: PendingUploadFile[] = [],
      accountCredentials?: {
        mode: 'register' | 'login';
        identifier: string;
        password: string;
      }
    ): Promise<FrontpageRegistrationResult | null> => {
      if (currentUser && isAccountDeactivated) {
        showToast({
          type: 'error',
          title: 'Akun dinonaktifkan',
          description:
            'Akun Anda saat ini tidak aktif. Hubungi Sekretariat Paroki untuk mengaktifkan kembali.',
        });
        return null;
      }

      if (currentUser && classesLoaded) {
        return executeFrontpageRegistration(currentUser, data, pendingUploads);
      }

      if (currentUser && !classesLoaded) {
        // Signed in, wait briefly for Firestore classes snapshot to arrive
        setPendingFrontpageSubmission({ data, pendingUploads });
        setIsSubmittingFrontpageRegistration(true);
        return null;
      }

      // Public visitor: authenticate or create participant account right in place
      if (!accountCredentials) {
        showToast({
          type: 'warning',
          title: 'Lengkapi akun portal peserta',
          description: 'Masukkan username/email dan kata sandi pada bagian Akun Portal Peserta.',
        });
        return null;
      }

      const { mode, identifier, password } = accountCredentials;
      if (!isValidLoginIdentifier(identifier)) {
        showToast({
          type: 'warning',
          title: 'Username atau email tidak valid',
          description: 'Gunakan username (min. 3 karakter) atau alamat email yang valid.',
        });
        return null;
      }
      if (mode === 'register' && isReservedUsername(identifier)) {
        showToast({
          type: 'warning',
          title: 'Username tidak tersedia',
          description: 'Username tersebut khusus pengurus paroki. Pilih username atau email lain.',
        });
        return null;
      }
      if (password.length < (mode === 'register' ? 8 : 6)) {
        showToast({
          type: 'warning',
          title: 'Kata sandi terlalu pendek',
          description:
            mode === 'register'
              ? 'Gunakan kata sandi minimal 8 karakter untuk akun baru Anda.'
              : 'Masukkan kata sandi akun Anda yang valid.',
        });
        return null;
      }

      const resolvedEmail = resolveLoginEmail(identifier);
      setPendingFrontpageSubmission({ data, pendingUploads });
      keepPublicOnSignInRef.current = true;
      setIsSubmittingFrontpageRegistration(true);
      try {
        if (mode === 'register') {
          const credential = await createUserWithEmailAndPassword(auth, resolvedEmail, password);
          await updateProfile(credential.user, {
            displayName: data.fullName.trim().slice(0, 120),
          }).catch(() => {
            // Non-critical displayName update
          });
        } else {
          await signInWithEmailAndPassword(auth, resolvedEmail, password);
        }
        return null;
      } catch (error) {
        keepPublicOnSignInRef.current = false;
        setPendingFrontpageSubmission(null);
        setIsSubmittingFrontpageRegistration(false);
        showToast({
          type: 'error',
          title: mode === 'register' ? 'Gagal membuat akun peserta' : 'Gagal masuk ke akun',
          description: formatFirebaseAuthError(error),
        });
        return null;
      }
    },
    [classesLoaded, currentUser, executeFrontpageRegistration, isAccountDeactivated, showToast]
  );

  // Automatically complete queued frontpage registration right after Google sign-in and classes load
  useEffect(() => {
    if (!pendingFrontpageSubmission || !authReady || !currentUser) {
      return;
    }

    if (isAccountDeactivated) {
      setPendingFrontpageSubmission(null);
      setIsSubmittingFrontpageRegistration(false);
      showToast({
        type: 'error',
        title: 'Akun dinonaktifkan',
        description:
          'Pendaftaran tidak dapat diproses karena akun Anda nonaktif. Hubungi Sekretariat Paroki.',
      });
      return;
    }

    if (isSeedingData || !classesLoaded) {
      return;
    }

    const queued = pendingFrontpageSubmission;
    setPendingFrontpageSubmission(null);
    void executeFrontpageRegistration(currentUser, queued.data, queued.pendingUploads);
  }, [
    authReady,
    classesLoaded,
    currentUser,
    executeFrontpageRegistration,
    isAccountDeactivated,
    isSeedingData,
    pendingFrontpageSubmission,
    showToast,
  ]);

  const updateParticipant = useCallback(
    async (id: string, updates: Partial<Participant>) => {
      const payload: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      if (updates.fullName !== undefined) payload.fullName = updates.fullName.slice(0, 120);
      if (updates.birthDate !== undefined) payload.birthDate = updates.birthDate;
      if (updates.phone !== undefined) payload.phone = updates.phone.slice(0, 30);
      if (updates.email !== undefined) payload.email = updates.email.slice(0, 160);
      if (updates.lingkungan !== undefined) payload.lingkungan = updates.lingkungan.slice(0, 80);
      if (updates.program !== undefined) payload.program = updates.program;
      if (updates.classId !== undefined) payload.classId = updates.classId;
      if (updates.sponsorName !== undefined) payload.sponsorName = updates.sponsorName.slice(0, 120);
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.attendanceCount !== undefined) payload.attendanceCount = updates.attendanceCount;
      if (updates.documents !== undefined) payload.documents = updates.documents;
      if (updates.notes !== undefined) {
        payload.notes = updates.notes.trim().slice(0, 600);
      }

      try {
        await updateDoc(doc(db, 'participants', id), payload);
        showToast({
          type: 'success',
          title: 'Perubahan data disimpan',
          description: 'Informasi peserta telah diperbarui di Firestore.',
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `participants/${id}`);
      }
    },
    [showToast]
  );

  const deleteParticipant = useCallback(
    async (id: string) => {
      const target = participants.find((p) => p.id === id);
      try {
        // Clean up attachment subcollection docs before removing parent participant
        const attachmentsSnap = await getDocs(collection(db, 'participants', id, 'attachments'));
        const batch = writeBatch(db);
        attachmentsSnap.docs.forEach((attDoc) => batch.delete(attDoc.ref));
        approvals
          .filter((a) => a.participantId === id)
          .forEach((apr) => batch.delete(doc(db, 'approvals', apr.id)));
        batch.delete(doc(db, 'participants', id));
        await batch.commit();

        showToast({
          type: 'success',
          title: 'Data peserta dihapus',
          description: target ? `${target.fullName} telah dihapus dari basis data.` : 'Data dihapus.',
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `participants/${id}`);
      }
    },
    [approvals, participants, showToast]
  );

  const bulkUpdateParticipantStatus = useCallback(
    async (ids: string[], status: ParticipantStatus) => {
      try {
        const batch = writeBatch(db);
        ids.forEach((id) => {
          batch.update(doc(db, 'participants', id), {
            status,
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
        showToast({
          type: 'success',
          title: 'Status massal diperbarui',
          description: `${ids.length} peserta diubah statusnya menjadi "${status}".`,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'participants');
      }
    },
    [showToast]
  );

  const bulkDeleteParticipants = useCallback(
    async (ids: string[]) => {
      try {
        const batch = writeBatch(db);
        for (const id of ids) {
          const attachmentsSnap = await getDocs(collection(db, 'participants', id, 'attachments'));
          attachmentsSnap.docs.forEach((attDoc) => batch.delete(attDoc.ref));
          batch.delete(doc(db, 'participants', id));
        }
        approvals
          .filter((a) => ids.includes(a.participantId))
          .forEach((a) => batch.delete(doc(db, 'approvals', a.id)));
        await batch.commit();
        showToast({
          type: 'success',
          title: `${ids.length} data peserta dihapus`,
          description: 'Daftar peserta telah diperbarui di Firestore.',
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'participants');
      }
    },
    [approvals, showToast]
  );

  // Classes & Attendance CRUD
  const toggleSessionAttendance = useCallback(
    async (classId: string, sessionId: string, participantId: string) => {
      const targetClass = classes.find((c) => c.id === classId);
      const targetParticipant = participants.find((p) => p.id === participantId);
      if (!targetClass) return;

      let wasPresent = false;
      const nextSessions = targetClass.sessions.map((ses) => {
        if (ses.id !== sessionId) return ses;
        wasPresent = ses.presentParticipantIds.includes(participantId);
        return {
          ...ses,
          presentParticipantIds: wasPresent
            ? ses.presentParticipantIds.filter((x) => x !== participantId)
            : [...ses.presentParticipantIds, participantId],
        };
      });

      try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'classes', classId), {
          sessions: nextSessions,
          updatedAt: serverTimestamp(),
        });
        if (targetParticipant) {
          const nextCount = Math.max(
            0,
            Math.min(
              targetParticipant.totalSessions,
              targetParticipant.attendanceCount + (wasPresent ? -1 : 1)
            )
          );
          batch.update(doc(db, 'participants', participantId), {
            attendanceCount: nextCount,
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `classes/${classId}`);
      }
    },
    [classes, participants]
  );

  const completeClassSession = useCallback(
    async (classId: string, sessionId: string) => {
      const targetClass = classes.find((c) => c.id === classId);
      if (!targetClass) return;
      const nextSessions = targetClass.sessions.map((ses) =>
        ses.id === sessionId ? { ...ses, completed: true } : ses
      );
      try {
        await updateDoc(doc(db, 'classes', classId), {
          sessions: nextSessions,
          updatedAt: serverTimestamp(),
        });
        showToast({
          type: 'success',
          title: 'Daftar hadir pertemuan disimpan',
          description: 'Status pertemuan ditandai selesai dan tersimpan di Firestore.',
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `classes/${classId}`);
      }
    },
    [classes, showToast]
  );

  const addClassSession = useCallback(
    async (classId: string, date: string, topic: string) => {
      const targetClass = classes.find((c) => c.id === classId);
      if (!targetClass) return;
      const nextSessions = [
        ...targetClass.sessions,
        {
          id: `ses-${Date.now()}`,
          date,
          topic: topic.slice(0, 140),
          completed: false,
          presentParticipantIds: [],
        },
      ].slice(0, 50);

      try {
        await updateDoc(doc(db, 'classes', classId), {
          sessions: nextSessions,
          updatedAt: serverTimestamp(),
        });
        showToast({
          type: 'success',
          title: 'Jadwal pertemuan ditambahkan',
          description: `Topik "${topic}" telah dijadwalkan pada ${date}.`,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `classes/${classId}`);
      }
    },
    [classes, showToast]
  );

  // Approvals Workflow
  const submitApprovalRequest = useCallback(
    async (
      participantId: string,
      requestType: ApprovalRequest['requestType'],
      summaryNote: string
    ) => {
      if (!currentUser) return;
      const target = participants.find((p) => p.id === participantId);
      if (!target) return;

      const hasPending = approvals.some(
        (a) => a.participantId === participantId && a.status === 'Menunggu'
      );
      if (hasPending) {
        showToast({
          type: 'warning',
          title: 'Pengajuan masih dalam antrean',
          description: `${target.fullName} sudah memiliki pengajuan yang menunggu keputusan Pastor Paroki.`,
        });
        return;
      }

      const approvalId = `apr-${Date.now()}`;
      const notifId = `ntf-${Date.now()}`;
      const nowDate = new Date().toISOString().slice(0, 10);
      const nowStamp = new Date().toLocaleString('id-ID', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      const actorName = (
        currentUserProfile?.name ||
        currentUser.displayName ||
        ROLE_PROFILES[role].personName
      ).slice(0, 120);
      const actorRoleLabel = ROLE_PROFILES[role].personTitle;
      const pct = Math.round((target.attendanceCount / Math.max(1, target.totalSessions)) * 100);
      const attendanceSummary =
        `${target.attendanceCount} dari ${target.totalSessions} pertemuan (${pct}%)`.slice(0, 120);
      const docsComplete =
        target.documents.ktpKk &&
        target.documents.suratBaptisAtauRekomendasi &&
        target.documents.pasFoto;
      const cleanNote = (
        summaryNote.trim() ||
        `Pengajuan ${requestType.toLowerCase()} untuk ${target.fullName} oleh ${actorName}.`
      ).slice(0, 600);
      const isResubmission = target.status === 'Perlu Revisi';

      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'approvals', approvalId), {
          code: `VER-2026-0${approvals.length + 18}`,
          participantId: target.id,
          participantName: target.fullName.slice(0, 120),
          program: target.program,
          lingkungan: target.lingkungan.slice(0, 80),
          requestType,
          submittedBy: actorName,
          submittedByUid: currentUser.uid,
          submittedAt: nowDate,
          status: 'Menunggu',
          attendanceSummary,
          documentsComplete: docsComplete,
          summaryNote: cleanNote,
          history: [
            {
              id: `h-${Date.now()}`,
              date: nowStamp,
              actorName,
              actorRole: actorRoleLabel,
              action: isResubmission ? 'Mengajukan Ulang Setelah Revisi' : 'Mengajukan Persetujuan',
              note: cleanNote,
            },
          ],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (target.status === 'Perlu Revisi') {
          batch.update(doc(db, 'participants', target.id), {
            status: 'Menunggu Verifikasi',
            notes: cleanNote,
            updatedAt: serverTimestamp(),
          });
        }

        batch.set(doc(db, 'notifications', notifId), {
          title: `${isResubmission ? 'Pengajuan ulang' : 'Pengajuan baru'}: ${target.fullName}`.slice(
            0,
            160
          ),
          description:
            `${actorName} mengajukan ${requestType} untuk ${target.fullName} (${target.program}).`.slice(
              0,
              400
            ),
          timeLabel: 'Baru saja',
          read: false,
          targetPage: 'approvals',
          roles: ['admin', 'approver'],
          createdAt: serverTimestamp(),
        });

        await batch.commit();
        showToast({
          type: 'success',
          title: isResubmission
            ? 'Pengajuan ulang dikirim ke Pastor Paroki'
            : 'Pengajuan dikirim ke Pastor Paroki',
          description: `${target.fullName} kini masuk antrean ${requestType}.`,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `approvals/${approvalId}`);
      }
    },
    [approvals, currentUser, currentUserProfile, participants, role, showToast]
  );

  const decideApproval = useCallback(
    async (
      approvalId: string,
      decision: Exclude<ApprovalStatus, 'Menunggu'>,
      note: string
    ) => {
      const target = approvals.find((a) => a.id === approvalId);
      if (!target) return;

      const actorName = (
        currentUserProfile?.name ||
        currentUser?.displayName ||
        ROLE_PROFILES[role].personName
      ).slice(0, 120);
      const actorRoleLabel = ROLE_PROFILES[role].personTitle;
      const nowDate = new Date().toISOString().slice(0, 10);
      const nowTime = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const actionLabel =
        decision === 'Disetujui'
          ? 'Menyetujui Pengajuan'
          : decision === 'Perlu Revisi'
            ? 'Meminta Revisi'
            : 'Menolak Pengajuan';

      const cleanNote = note.trim().slice(0, 600);
      const nextHistory = [
        ...target.history,
        {
          id: `h-${Date.now()}`,
          date: `${nowDate} ${nowTime}`,
          actorName,
          actorRole: actorRoleLabel,
          action: actionLabel,
          note: cleanNote,
        },
      ].slice(-25);

      // Accurate flowchart status transition based on requestType
      const nextParticipantStatus: ParticipantStatus =
        decision === 'Disetujui'
          ? target.requestType === 'Kelayakan Penerimaan Sakramen'
            ? 'Siap Sakramen'
            : 'Aktif'
          : 'Perlu Revisi';

      const linkedParticipant = participants.find((p) => p.id === target.participantId);

      try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'approvals', approvalId), {
          status: decision,
          decisionNote: cleanNote,
          decidedAt: nowDate,
          decidedBy: actorName,
          history: nextHistory,
          updatedAt: serverTimestamp(),
        });
        if (linkedParticipant) {
          batch.update(doc(db, 'participants', target.participantId), {
            status: nextParticipantStatus,
            notes: cleanNote,
            updatedAt: serverTimestamp(),
          });
        }

        // Notify operational catechists & admins of Pastor's decision
        const staffNotifId = `ntf-staff-${Date.now()}`;
        batch.set(doc(db, 'notifications', staffNotifId), {
          title: `${target.requestType}: ${target.participantName} (${decision})`.slice(0, 160),
          description:
            `${actorName} menetapkan status "${nextParticipantStatus}". ${cleanNote}`.slice(0, 400),
          timeLabel: 'Baru saja',
          read: false,
          targetPage: 'participants',
          roles: ['admin', 'operational'],
          createdAt: serverTimestamp(),
        });

        // Notify the participant directly if linked to a distinct user account
        if (
          linkedParticipant &&
          linkedParticipant.ownerUid &&
          linkedParticipant.ownerUid !== currentUser?.uid &&
          /^[a-zA-Z0-9_-]{1,128}$/.test(linkedParticipant.ownerUid)
        ) {
          const userNotifId = `ntf-usr-${Date.now()}`;
          batch.set(doc(db, 'notifications', userNotifId), {
            title:
              decision === 'Disetujui'
                ? nextParticipantStatus === 'Siap Sakramen'
                  ? 'Selamat! Anda dinyatakan Siap Menerima Sakramen'
                  : 'Berkas pendaftaran Anda telah diverifikasi'
                : 'Berkas katekese Anda memerlukan perbaikan',
            description:
              (cleanNote ||
                `Status pembinaan Anda diperbarui menjadi ${nextParticipantStatus}.`).slice(0, 400),
            timeLabel: 'Baru saja',
            read: false,
            targetPage: 'dashboard',
            roles: ['general'],
            recipientUid: linkedParticipant.ownerUid,
            createdAt: serverTimestamp(),
          });
        }

        await batch.commit();

        showToast({
          type:
            decision === 'Disetujui'
              ? 'success'
              : decision === 'Perlu Revisi'
                ? 'warning'
                : 'error',
          title: `Pengajuan ${decision.toLowerCase()}`,
          description: `Status peserta diperbarui menjadi "${nextParticipantStatus}" dan notifikasi telah dikirim.`,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `approvals/${approvalId}`);
      }
    },
    [approvals, currentUser, currentUserProfile, participants, role, showToast]
  );

  // Materials CRUD & Per-User Progress
  const toggleMaterialCompleted = useCallback(
    async (materialId: string) => {
      if (!currentUser) return;
      const nextCompleted = !materialProgressMap[materialId];
      const path = `users/${currentUser.uid}/progress/${materialId}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'progress', materialId), {
          userId: currentUser.uid,
          materialId,
          completed: nextCompleted,
          updatedAt: serverTimestamp(),
        });
        showToast({ type: 'success', title: 'Progres bacaan diperbarui' });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [currentUser, materialProgressMap, showToast]
  );

  const addMaterial = useCallback(
    async (material: Omit<StudyMaterial, 'id' | 'updatedAt'>) => {
      const id = `mat-${Date.now()}`;
      try {
        await setDoc(doc(db, 'materials', id), {
          title: material.title.slice(0, 160),
          program: material.program,
          sessionNumber: Math.min(100, Math.max(1, Math.round(material.sessionNumber))),
          durationMinutes: Math.min(300, Math.max(5, Math.round(material.durationMinutes))),
          author: material.author.slice(0, 120),
          updatedAt: new Date().toISOString().slice(0, 10),
          summary: material.summary.slice(0, 1000),
          keyPoints: material.keyPoints.slice(0, 20),
          createdAt: serverTimestamp(),
        });
        showToast({
          type: 'success',
          title: 'Materi pembinaan dipublikasikan',
          description: `"${material.title}" kini tersimpan dan dapat diakses seluruh peserta.`,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `materials/${id}`);
      }
    },
    [showToast]
  );

  // Users CRUD (Admin)
  const addUser = useCallback(
    async (user: Omit<SystemUser, 'id' | 'lastActive'> & { password?: string }) => {
      const resolvedEmail = resolveLoginEmail(user.email);
      let targetUid = `usr-${Date.now()}`;

      if (user.password && user.password.length >= 8) {
        try {
          targetUid = await createSecondaryAuthAccount(resolvedEmail, user.password, user.name);
        } catch (error) {
          showToast({
            type: 'error',
            title: 'Gagal membuat akun login',
            description: formatFirebaseAuthError(error),
          });
          throw error;
        }
      }

      try {
        await setDoc(doc(db, 'users', targetUid), {
          uid: targetUid,
          name: user.name.slice(0, 120),
          email: resolvedEmail.slice(0, 160),
          role: user.role,
          lingkungan: user.lingkungan.slice(0, 100),
          active: user.active,
          lastActive: 'Baru ditambahkan',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast({
          type: 'success',
          title: 'Pengguna berhasil ditambahkan',
          description: `${user.name} (${ROLE_PROFILES[user.role].label}) kini siap masuk menggunakan username/email dan kata sandi.`,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${targetUid}`);
      }
    },
    [showToast]
  );

  const updateUserRole = useCallback(
    async (userId: string, nextRole: UserRole) => {
      try {
        await updateDoc(doc(db, 'users', userId), {
          role: nextRole,
          updatedAt: serverTimestamp(),
        });
        showToast({
          type: 'success',
          title: 'Peran pengguna diperbarui',
          description: `Hak akses diubah menjadi ${ROLE_PROFILES[nextRole].label}.`,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      }
    },
    [showToast]
  );

  const toggleUserActive = useCallback(
    async (userId: string) => {
      const target = users.find((u) => u.id === userId);
      if (!target) return;
      try {
        await updateDoc(doc(db, 'users', userId), {
          active: !target.active,
          updatedAt: serverTimestamp(),
        });
        showToast({
          type: target.active ? 'warning' : 'success',
          title: target.active ? 'Akun dinonaktifkan' : 'Akun diaktifkan kembali',
          description: `Status akses untuk ${target.name} telah diperbarui.`,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      }
    },
    [showToast, users]
  );

  // Settings Update (Admin)
  const updateSettings = useCallback(
    async (nextSettings: ParishSettings, options?: { silent?: boolean }) => {
      try {
        await setDoc(doc(db, 'settings', 'parish'), {
          ...nextSettings,
          updatedAt: serverTimestamp(),
        });
        if (!options?.silent) {
          showToast({
            type: 'success',
            title: 'Pengaturan paroki disimpan',
            description: 'Konfigurasi tahun ajaran dan aturan katekese telah tersimpan di Firestore.',
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'settings/parish');
      }
    },
    [showToast]
  );

  // Public Frontpage CMS Actions (Admin & Operational Staff)
  const updateFrontpageContent = useCallback(
    async (next: FrontpageContent, options?: { silent?: boolean }) => {
      try {
        const sanitizedPayload = {
          parishLabel: next.parishLabel.trim().slice(0, 120),
          heroTitle: next.heroTitle.trim().slice(0, 160),
          heroSubtitle: next.heroSubtitle.trim().slice(0, 500),
          heroPrimaryCtaLabel: next.heroPrimaryCtaLabel.trim().slice(0, 60),
          heroSecondaryCtaLabel: next.heroSecondaryCtaLabel.trim().slice(0, 60),
          showScriptureSection: Boolean(next.showScriptureSection),
          scriptureHeading: next.scriptureHeading.trim().slice(0, 100),
          scriptureQuote: next.scriptureQuote.trim().slice(0, 500),
          scriptureSource: next.scriptureSource.trim().slice(0, 100),
          scriptureNote: next.scriptureNote.trim().slice(0, 300),
          programsEyebrow: next.programsEyebrow.trim().slice(0, 80),
          programsHeading: next.programsHeading.trim().slice(0, 140),
          programsSubtitle: next.programsSubtitle.trim().slice(0, 300),
          showRolesSection: Boolean(next.showRolesSection),
          rolesHeading: next.rolesHeading.trim().slice(0, 120),
          rolesSubtitle: next.rolesSubtitle.trim().slice(0, 300),
          roleHighlights: next.roleHighlights.slice(0, 8).map((item) => ({
            title: item.title.trim().slice(0, 80),
            description: item.description.trim().slice(0, 260),
            iconType: item.iconType,
          })),
          aboutTitle: next.aboutTitle.trim().slice(0, 160),
          aboutContent: next.aboutContent.trim().slice(0, 2000),
          aboutHighlights: next.aboutHighlights
            .map((s) => s.trim().slice(0, 240))
            .filter(Boolean)
            .slice(0, 12),
          guideTitle: next.guideTitle.trim().slice(0, 160),
          guideIntro: next.guideIntro.trim().slice(0, 500),
          guideSteps: next.guideSteps
            .filter((s) => s.title.trim().length > 0)
            .slice(0, 10)
            .map((s) => ({
              title: s.title.trim().slice(0, 120),
              description: s.description.trim().slice(0, 320),
            })),
          showFaqSection: Boolean(next.showFaqSection),
          faqs: next.faqs
            .filter((f) => f.question.trim().length > 0 && f.answer.trim().length > 0)
            .slice(0, 20)
            .map((f) => ({
              question: f.question.trim().slice(0, 200),
              answer: f.answer.trim().slice(0, 600),
            })),
          contactTitle: next.contactTitle.trim().slice(0, 140),
          contactDescription: next.contactDescription.trim().slice(0, 500),
          contactAddress: next.contactAddress.trim().slice(0, 300),
          contactHours: next.contactHours.trim().slice(0, 200),
          contactEmail: next.contactEmail.trim().slice(0, 160),
          contactPhone: next.contactPhone.trim().slice(0, 100),
          footerTagline: next.footerTagline.trim().slice(0, 180),
          footerCopyright: next.footerCopyright.trim().slice(0, 180),
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'publicContent', 'frontpage'), sanitizedPayload);
        if (!options?.silent) {
          showToast({
            type: 'success',
            title: 'Konten halaman depan diperbarui',
            description: 'Perubahan langsung tampil di Website Publik Catevia.',
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'publicContent/frontpage');
      }
    },
    [showToast]
  );

  // Automatic single-source-of-truth self-heal: keep publicContent/frontpage aligned with settings/parish
  useEffect(() => {
    const canWriteCms =
      authReady &&
      Boolean(currentUser) &&
      !isAccountDeactivated &&
      (actualRole === 'admin' || actualRole === 'operational');
    if (!canWriteCms || !settingsLoaded || !frontpageLoaded) return;

    if (!isFrontpageOutOfSyncWithParish(frontpageContent, settings)) return;

    const sig = `${settings.parishName}|${settings.contactEmail}|${settings.contactPhone}|${frontpageContent.parishLabel}|${frontpageContent.aboutTitle}|${frontpageContent.footerCopyright}`;
    if (lastAutoSyncSigRef.current === sig) return;
    lastAutoSyncSigRef.current = sig;

    const synced = syncFrontpageWithParishSettings(frontpageContent, settings);
    void updateFrontpageContent(synced, { silent: true });
  }, [
    authReady,
    currentUser,
    isAccountDeactivated,
    actualRole,
    settingsLoaded,
    frontpageLoaded,
    settings,
    frontpageContent,
    updateFrontpageContent,
  ]);

  // Also scrub legacy seeded "Ruang St. Yoseph" room label from publicPrograms if parish has been renamed
  useEffect(() => {
    const canWriteCms =
      authReady &&
      Boolean(currentUser) &&
      !isAccountDeactivated &&
      (actualRole === 'admin' || actualRole === 'operational');
    if (!canWriteCms || !settingsLoaded || !programsLoaded || cleanedProgramScheduleRef.current) {
      return;
    }
    if (settings.parishName.toLowerCase().includes('yoseph')) return;

    const stalePrograms = publicPrograms.filter((p) =>
      p.scheduleSummary.toLowerCase().includes('st. yoseph')
    );
    if (stalePrograms.length === 0) return;

    cleanedProgramScheduleRef.current = true;
    stalePrograms.forEach((p) => {
      const nextSchedule = p.scheduleSummary.replace(/Ruang St\. Yoseph/gi, 'Ruang Katekese Paroki');
      void updateDoc(doc(db, 'publicPrograms', p.id), {
        scheduleSummary: nextSchedule.slice(0, 180),
        updatedAt: serverTimestamp(),
      }).catch((err) => {
        console.warn('Skipped legacy schedule cleanup:', err);
      });
    });
  }, [
    authReady,
    currentUser,
    isAccountDeactivated,
    actualRole,
    settingsLoaded,
    programsLoaded,
    settings.parishName,
    publicPrograms,
  ]);

  const createPublicProgram = useCallback(
    async (data: Omit<PublicProgram, 'id' | 'updatedAt'>) => {
      const id = `pub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const clampedOrder = Math.max(0, Math.min(500, Math.round(data.displayOrder || 1)));
      try {
        await setDoc(doc(db, 'publicPrograms', id), {
          name: data.name.trim().slice(0, 140),
          iconType: data.iconType,
          audience: data.audience.trim().slice(0, 140),
          mode: data.mode.trim().slice(0, 120),
          scheduleSummary: data.scheduleSummary.trim().slice(0, 180),
          status: data.status,
          summary: data.summary.trim().slice(0, 300),
          overview: data.overview.trim().slice(0, 1200),
          learnItems: data.learnItems.map((x) => x.trim().slice(0, 200)).filter(Boolean).slice(0, 12),
          requirements: data.requirements
            .map((x) => x.trim().slice(0, 220))
            .filter(Boolean)
            .slice(0, 12),
          documents: data.documents.map((x) => x.trim().slice(0, 220)).filter(Boolean).slice(0, 12),
          policyNote: data.policyNote.trim().slice(0, 500),
          linkedProgram: data.linkedProgram,
          published: Boolean(data.published),
          displayOrder: clampedOrder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast({
          type: 'success',
          title: 'Program publik ditambahkan',
          description: `${data.name.trim()} kini tersedia di manajemen program CMS.`,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `publicPrograms/${id}`);
      }
    },
    [showToast]
  );

  const updatePublicProgram = useCallback(
    async (id: string, updates: Omit<PublicProgram, 'id' | 'updatedAt'>) => {
      const clampedOrder = Math.max(0, Math.min(500, Math.round(updates.displayOrder || 1)));
      try {
        await updateDoc(doc(db, 'publicPrograms', id), {
          name: updates.name.trim().slice(0, 140),
          iconType: updates.iconType,
          audience: updates.audience.trim().slice(0, 140),
          mode: updates.mode.trim().slice(0, 120),
          scheduleSummary: updates.scheduleSummary.trim().slice(0, 180),
          status: updates.status,
          summary: updates.summary.trim().slice(0, 300),
          overview: updates.overview.trim().slice(0, 1200),
          learnItems: updates.learnItems
            .map((x) => x.trim().slice(0, 200))
            .filter(Boolean)
            .slice(0, 12),
          requirements: updates.requirements
            .map((x) => x.trim().slice(0, 220))
            .filter(Boolean)
            .slice(0, 12),
          documents: updates.documents
            .map((x) => x.trim().slice(0, 220))
            .filter(Boolean)
            .slice(0, 12),
          policyNote: updates.policyNote.trim().slice(0, 500),
          linkedProgram: updates.linkedProgram,
          published: Boolean(updates.published),
          displayOrder: clampedOrder,
          updatedAt: serverTimestamp(),
        });
        showToast({
          type: 'success',
          title: 'Program publik diperbarui',
          description: `Informasi ${updates.name.trim()} telah disimpan ke Firestore.`,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `publicPrograms/${id}`);
      }
    },
    [showToast]
  );

  const deletePublicProgram = useCallback(
    async (id: string) => {
      const target = publicPrograms.find((p) => p.id === id);
      try {
        await deleteDoc(doc(db, 'publicPrograms', id));
        showToast({
          type: 'info',
          title: 'Program publik dihapus',
          description: target ? `${target.name} dihapus dari halaman depan.` : undefined,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `publicPrograms/${id}`);
      }
    },
    [publicPrograms, showToast]
  );

  const togglePublicProgramPublished = useCallback(
    async (id: string) => {
      const target = publicPrograms.find((p) => p.id === id);
      if (!target) return;
      try {
        await updateDoc(doc(db, 'publicPrograms', id), {
          published: !target.published,
          updatedAt: serverTimestamp(),
        });
        showToast({
          type: 'success',
          title: target.published ? 'Program disembunyikan (Draf)' : 'Program dipublikasikan',
          description: `${target.name} ${
            target.published ? 'tidak lagi tampil di halaman depan.' : 'kini tampil di Website Publik.'
          }`,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `publicPrograms/${id}`);
      }
    },
    [publicPrograms, showToast]
  );

  const reorderPublicProgram = useCallback(
    async (id: string, direction: 'up' | 'down') => {
      const sorted = [...publicPrograms].sort(
        (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
      );
      const index = sorted.findIndex((p) => p.id === id);
      if (index === -1) return;
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= sorted.length) return;

      const current = sorted[index];
      const neighbor = sorted[swapIndex];
      const nextCurrentOrder = swapIndex + 1;
      const nextNeighborOrder = index + 1;

      try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'publicPrograms', current.id), {
          displayOrder: nextCurrentOrder,
          updatedAt: serverTimestamp(),
        });
        batch.update(doc(db, 'publicPrograms', neighbor.id), {
          displayOrder: nextNeighborOrder,
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `publicPrograms/${id}`);
      }
    },
    [publicPrograms]
  );

  // Notifications
  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read && n.roles.includes(role));
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach((n) => batch.update(doc(db, 'notifications', n.id), { read: true }));
      await batch.commit();
      showToast({ type: 'info', title: 'Semua notifikasi ditandai sudah dibaca' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  }, [notifications, role, showToast]);

  const jumpToParticipantDetail = useCallback((participantId: string) => {
    setSelectedParticipantIdFromSearch(participantId);
    setActivePage('participants');
    setGlobalSearchOpen(false);
  }, []);

  return (
    <AppContext.Provider
      value={{
        authReady,
        authLoading,
        authError,
        currentUser,
        currentUserProfile,
        actualRole,
        role,
        isPreviewingRole,
        isAccountDeactivated,
        fatalFirestoreError,
        setRole,
        signInWithCredentials,
        registerWithCredentials,
        clearAuthError,
        signOut,
        isSeedingData,
        siteMode,
        setSiteMode,
        openPublicWebsite,
        openLoginScreen,
        openPortal,
        startPublicRegistration,
        isSubmittingFrontpageRegistration,
        lastFrontpageRegistrationResult,
        clearFrontpageRegistrationResult: () => setLastFrontpageRegistrationResult(null),
        submitFrontpageRegistration,
        activePage,
        navigate,
        isPageLoading,
        triggerPageRefresh,
        frontpageContent,
        publicPrograms,
        updateFrontpageContent,
        createPublicProgram,
        updatePublicProgram,
        deletePublicProgram,
        togglePublicProgramPublished,
        reorderPublicProgram,
        participants,
        classes,
        approvals,
        materials,
        users,
        notifications,
        settings,
        isRegistrationWizardOpen,
        wizardPreselectedProgram,
        openRegistrationWizard,
        closeRegistrationWizard,
        isGlobalSearchOpen,
        setGlobalSearchOpen,
        selectedParticipantIdFromSearch,
        clearSelectedParticipantFromSearch: () => setSelectedParticipantIdFromSearch(null),
        jumpToParticipantDetail,
        participantDraft,
        saveParticipantDraft,
        clearParticipantDraft,
        loadParticipantAttachments,
        uploadParticipantAttachment,
        addParticipant,
        updateParticipant,
        deleteParticipant,
        bulkUpdateParticipantStatus,
        bulkDeleteParticipants,
        toggleSessionAttendance,
        completeClassSession,
        addClassSession,
        submitApprovalRequest,
        decideApproval,
        toggleMaterialCompleted,
        addMaterial,
        addUser,
        updateUserRole,
        toggleUserActive,
        updateSettings,
        markNotificationRead,
        markAllNotificationsRead,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
