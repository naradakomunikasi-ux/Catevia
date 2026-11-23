# Catevia Security Specification (Phase 0 — Payload-First Security TDD)

## 1. Data Invariants

1. **Zero-Trust Default Deny**: Every unmatched path under `/databases/{database}/documents` is denied for all reads and writes.
2. **Verified Identity Mandatory**: All application reads and writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **RBAC Privilege Integrity**:
   - Users registering their own `/users/{uid}` profile may only assign `role == 'general'` and `active == true` (except the bootstrapped parish administrator `michael.gani@gmail.com`).
   - Users cannot elevate their own `role` or modify `active`. Only an active `admin` may modify roles or active status.
4. **PII Isolation**:
   - `/users/{userId}` contains `email`; `get` is restricted strictly to the profile owner or an active `admin`.
   - `/participants/{participantId}` contains `phone`, `email`, and `birthDate`; `get` is restricted strictly to the participant owner (`ownerUid == request.auth.uid`) or verified parish staff (`admin`, `operational`, `approver`).
5. **Relational & Attachment Integrity**:
   - A participant cannot be created referencing a non-existent `classId` in `/classes/{classId}`.
   - An attachment in `/participants/{participantId}/attachments/{docType}` requires the parent participant document to exist, `docType` to match the allowed enum (`ktpKk`, `suratBaptisAtauRekomendasi`, `pasFoto`), `previewDataUrl` strictly bounded (`<= 180000` chars), and `uploadedByUid == request.auth.uid`.
   - An approval request in `/approvals/{approvalId}` requires the referenced `participantId` to exist.
6. **Terminal State Locking**:
   - Once an `/approvals/{approvalId}` reaches a terminal status (`Disetujui` or `Ditolak`), non-admin users cannot overwrite or revert the decision.
7. **Strict Schema & Action-Based Updates**:
   - Every create checks both `hasAll(...)` and `hasOnly(...)` to block shadow/ghost fields.
   - Every update wraps `isValid[Entity](incoming())` and uses `affectedKeys().hasOnly([...])` for each permitted action branch.
   - All string fields enforce explicit `.size()` bounds; all IDs match `^[a-zA-Z0-9_\-]+$`; all timestamps on create/update validate against `request.time`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Attack Category | Target Path | Adversarial Payload / Action | Expected Result |
|---|----------------|-------------|------------------------------|-----------------|
| 1 | Self-Assigned Admin Role | `/users/attackerUid` (create) | `{ "uid": "attackerUid", "name": "Eve", "email": "eve@test.com", "role": "admin", "lingkungan": "St. Lukas", "active": true, "lastActive": "now", "createdAt": "<serverTime>", "updatedAt": "<serverTime>" }` | `PERMISSION_DENIED` |
| 2 | Role Escalation via Update | `/users/generalUid` (update) | `{ "role": "approver", "updatedAt": "<serverTime>" }` by `generalUid` | `PERMISSION_DENIED` |
| 3 | Unverified Email Admin Spoof | `/settings/parish` (write) | Authenticated token with `email: "michael.gani@gmail.com"`, `email_verified: false` | `PERMISSION_DENIED` |
| 4 | PII Cross-User Snooping | `/participants/p-02` (get) | Authenticated `general` user whose `uid != resource.data.ownerUid` attempts `get` | `PERMISSION_DENIED` |
| 5 | Ghost / Shadow Field Injection | `/participants/p-99` (create) | Valid participant fields + `{ "isVerified": true, "secretBypass": 1 }` | `PERMISSION_DENIED` |
| 6 | ID Poisoning (Resource Exhaustion) | `/participants/<200-char-junk-id>` (create) | Document ID exceeding 128 chars or containing invalid symbols `$@!` | `PERMISSION_DENIED` |
| 7 | Orphaned Participant Write | `/participants/p-orphan` (create) | Valid participant with `classId: "non-existent-class"` | `PERMISSION_DENIED` |
| 8 | Unauthorized Approval Decision | `/approvals/apr-01` (update) | `operational` user attempts `{ "status": "Disetujui", "decidedBy": "Maria", "updatedAt": "<serverTime>" }` | `PERMISSION_DENIED` |
| 9 | Terminal Approval Tampering | `/approvals/apr-05` (update) | `approver` attempts to revert an already `Disetujui` approval back to `Menunggu` | `PERMISSION_DENIED` |
| 10 | Oversized Attachment Payload | `/participants/p-01/attachments/pasFoto` (create) | `previewDataUrl` string of length `250000` (> `180000` cap) | `PERMISSION_DENIED` |
| 11 | Forged Client Timestamp | `/materials/mat-99` (create) | `createdAt` set to backdated client date instead of `request.time` | `PERMISSION_DENIED` |
| 12 | Immutable Field Tampering | `/participants/p-01` (update) | Changing `ownerUid` or `createdAt` on an existing participant document | `PERMISSION_DENIED` |
