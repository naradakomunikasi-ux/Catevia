/**
 * Catevia Firestore Security Rules — Dirty Dozen Verification Suite (Phase 0 TDD)
 *
 * Run against Firebase Emulator Suite (`@firebase/rules-unit-testing`) when executing
 * emulator-based security verification. All 12 adversarial cases must return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  actor: {
    uid: string;
    email: string;
    emailVerified: boolean;
    role: 'admin' | 'operational' | 'approver' | 'general';
  };
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Blocks self-assigned admin role during user profile creation',
    actor: { uid: 'attacker-1', email: 'eve@example.com', emailVerified: true, role: 'general' },
    operation: 'create',
    path: 'users/attacker-1',
    payload: {
      uid: 'attacker-1',
      name: 'Eve Attacker',
      email: 'eve@example.com',
      role: 'admin',
      lingkungan: 'St. Lukas',
      active: true,
      lastActive: 'Baru saja',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Blocks privilege escalation via self profile update',
    actor: { uid: 'user-general-1', email: 'clara@example.com', emailVerified: true, role: 'general' },
    operation: 'update',
    path: 'users/user-general-1',
    payload: {
      role: 'approver',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Blocks unverified email spoofing bootstrapped admin',
    actor: { uid: 'spoof-uid', email: 'michael.gani@gmail.com', emailVerified: false, role: 'admin' },
    operation: 'update',
    path: 'settings/parish',
    payload: {
      parishName: 'Hijacked Parish',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Blocks PII cross-user read on participants collection',
    actor: { uid: 'user-general-1', email: 'clara@example.com', emailVerified: true, role: 'general' },
    operation: 'get',
    path: 'participants/p-02',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Blocks ghost/shadow field injection on participant create',
    actor: { uid: 'staff-op-1', email: 'maria@parokiyoseph.or.id', emailVerified: true, role: 'operational' },
    operation: 'create',
    path: 'participants/p-99',
    payload: {
      code: 'CTV-2699',
      fullName: 'Shadow Inject',
      isVerified: true,
      bypassFlag: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Blocks oversized or malformed document ID poisoning',
    actor: { uid: 'staff-op-1', email: 'maria@parokiyoseph.or.id', emailVerified: true, role: 'operational' },
    operation: 'create',
    path: `participants/${'a'.repeat(150)}`,
    payload: {
      code: 'CTV-2698',
      fullName: 'Junk ID',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Blocks orphaned participant referencing non-existent classId',
    actor: { uid: 'staff-op-1', email: 'maria@parokiyoseph.or.id', emailVerified: true, role: 'operational' },
    operation: 'create',
    path: 'participants/p-orphan',
    payload: {
      code: 'CTV-2697',
      fullName: 'Orphan User',
      classId: 'cls-does-not-exist',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Blocks operational user from approving sacrament requests',
    actor: { uid: 'staff-op-1', email: 'maria@parokiyoseph.or.id', emailVerified: true, role: 'operational' },
    operation: 'update',
    path: 'approvals/apr-01',
    payload: {
      status: 'Disetujui',
      decisionNote: 'Self-approved by operational staff',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Blocks non-admin modification of terminal Disetujui approval',
    actor: { uid: 'approver-1', email: 'pastor@parokiyoseph.or.id', emailVerified: true, role: 'approver' },
    operation: 'update',
    path: 'approvals/apr-05',
    payload: {
      status: 'Menunggu',
      decisionNote: 'Reverting terminal state',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Blocks oversized attachment payload exceeding 180KB bound',
    actor: { uid: 'user-general-1', email: 'clara@example.com', emailVerified: true, role: 'general' },
    operation: 'create',
    path: 'participants/p-01/attachments/pasFoto',
    payload: {
      participantId: 'p-01',
      docType: 'pasFoto',
      fileName: 'huge.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 500000,
      previewDataUrl: 'data:image/jpeg;base64,' + 'A'.repeat(200000),
      uploadedByUid: 'user-general-1',
      uploadedByName: 'Clara',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Blocks forged client timestamp on study material create',
    actor: { uid: 'staff-op-1', email: 'maria@parokiyoseph.or.id', emailVerified: true, role: 'operational' },
    operation: 'create',
    path: 'materials/mat-forged',
    payload: {
      title: 'Forged Timestamp Material',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Blocks immutable ownerUid / createdAt tampering on participant update',
    actor: { uid: 'staff-op-1', email: 'maria@parokiyoseph.or.id', emailVerified: true, role: 'operational' },
    operation: 'update',
    path: 'participants/p-01',
    payload: {
      ownerUid: 'hijacked-owner',
    },
    expected: 'PERMISSION_DENIED',
  },
];
