export interface Application {
  id: number;
  name: string;
  last_name: string;
  middle_name: string;
  province_name: string;
  district_name: string;
  faculty: string;
  direction: string;
  course: string;
  group: string;
  phone: string;
  passport: string;
  status: string;
  comment: string;
  admin_comment: string | null;
  document: string | null;
  user_image: string | null;
  passport_image_first: string | null;
  passport_image_second: string | null;
  created_at: string;
  dormitory_name: string;
  user: string | number;
  dormitory: number;
  province: number;
  district: number;
  gender?: string;
  student_id?: number;
}

export type CanonicalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED' | 'UNKNOWN';

// Ariza statusini bitta kanonik qiymatga keltirish (Applications.tsx bilan bir xil)
export const normalizeStatus = (status: string): CanonicalStatus => {
  if (status === 'PENDING' || status === 'Pending' || status === 'Yangi') return 'PENDING';
  if (status === 'APPROVED' || status === 'Approved' || status === 'Qabul qilindi') return 'APPROVED';
  if (status === 'REJECTED' || status === 'Rejected' || status === 'Rad etilgan') return 'REJECTED';
  if (status === 'CONVERTED' || status === 'Converted' || status === 'Talabaga aylantirilgan') return 'CONVERTED';
  return 'UNKNOWN';
};

// Status badge — semantic ranglar: pending=warning, approved=success, rejected=danger, converted=info
export const getStatusBadgeClasses = (status: string): string => {
  switch (normalizeStatus(status)) {
    case 'PENDING':
      return 'bg-warning-50 text-warning-700 border border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800';
    case 'APPROVED':
      return 'bg-success-50 text-success-700 border border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800';
    case 'REJECTED':
      return 'bg-danger-50 text-danger-700 border border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800';
    case 'CONVERTED':
      return 'bg-info-50 text-info-700 border border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800';
    default:
      return 'bg-surface-100 text-surface-700 border border-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-700';
  }
};

const statusLabels: Record<CanonicalStatus, string> = {
  PENDING: "Ko'rib chiqilmoqda",
  APPROVED: 'Qabul qilindi',
  REJECTED: 'Rad etilgan',
  CONVERTED: 'Talabaga aylantirilgan',
  UNKNOWN: "Noma'lum",
};

export const getStatusLabel = (status: string): string => {
  const canonical = normalizeStatus(status);
  return canonical === 'UNKNOWN' ? status : statusLabels[canonical];
};
