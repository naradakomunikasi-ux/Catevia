import { PageId, Permission, UserRole } from '../types/catevia';

export interface RoleMeta {
  id: UserRole;
  label: string;
  shortLabel: string;
  personName: string;
  personTitle: string;
  personEmail: string;
  description: string;
}

export const ROLE_PROFILES: Record<UserRole, RoleMeta> = {
  admin: {
    id: 'admin',
    label: 'Administrator Paroki',
    shortLabel: 'Admin',
    personName: 'Andreas Hartono',
    personTitle: 'Sekretariat & Admin Paroki',
    personEmail: 'admin@parokiyoseph.or.id',
    description: 'Mengelola seluruh sistem, pengguna, konfigurasi paroki, serta memantau operasional katekese.',
  },
  operational: {
    id: 'operational',
    label: 'Katekis / Staf Operasional',
    shortLabel: 'Katekis',
    personName: 'Maria Wulandari',
    personTitle: 'Koordinator Katekis',
    personEmail: 'maria.wulandari@parokiyoseph.or.id',
    description: 'Mencatat pendaftaran peserta, mengelola kelas, mengisi daftar hadir, dan melengkapi berkas.',
  },
  approver: {
    id: 'approver',
    label: 'Pastor Paroki / Penyetuju',
    shortLabel: 'Penyetuju',
    personName: 'RD. Yohanes Setiawan',
    personTitle: 'Pastor Kepala Paroki',
    personEmail: 'pastor.yohanes@parokiyoseph.or.id',
    description: 'Meninjau kelayakan calon penerima sakramen, memverifikasi berkas, dan memberikan persetujuan.',
  },
  general: {
    id: 'general',
    label: 'Peserta / Umat',
    shortLabel: 'Peserta',
    personName: 'Clara Novita Sari',
    personTitle: 'Peserta Katekumen · Lingk. St. Lukas',
    personEmail: 'clara.novita@email.com',
    description: 'Memantau jadwal pertemuan, perkembangan kehadiran, kelengkapan berkas, dan membaca materi pembinaan.',
  },
};

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_dashboard',
    'view_participants',
    'create_participant',
    'edit_participant',
    'delete_participant',
    'bulk_manage_participants',
    'view_classes',
    'manage_classes',
    'record_attendance',
    'view_materials',
    'manage_materials',
    'view_approvals',
    'decide_approvals',
    'view_reports',
    'export_reports',
    'manage_cms',
    'manage_users',
    'manage_settings',
  ],
  operational: [
    'view_dashboard',
    'view_participants',
    'create_participant',
    'edit_participant',
    'view_classes',
    'manage_classes',
    'record_attendance',
    'view_materials',
    'manage_materials',
    'view_reports',
    'export_reports',
    'manage_cms',
  ],
  approver: [
    'view_dashboard',
    'view_participants',
    'view_classes',
    'view_materials',
    'view_approvals',
    'decide_approvals',
    'view_reports',
    'export_reports',
  ],
  general: [
    'view_dashboard',
    'view_classes',
    'view_materials',
  ],
};

export const PAGE_REQUIRED_PERMISSION: Record<PageId, Permission> = {
  dashboard: 'view_dashboard',
  participants: 'view_participants',
  classes: 'view_classes',
  materials: 'view_materials',
  approvals: 'view_approvals',
  reports: 'view_reports',
  cms: 'manage_cms',
  users: 'manage_users',
  settings: 'manage_settings',
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessPage(role: UserRole, page: PageId): boolean {
  return hasPermission(role, PAGE_REQUIRED_PERMISSION[page]);
}
