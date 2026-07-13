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

const statusColors: Record<string, string> = {
  PENDING: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300',
  APPROVED: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300',
  REJECTED: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Ko\'rib chiqilmoqda',
  APPROVED: 'Qabul qilindi',
  REJECTED: 'Rad etilgan',
};

export const getStatusColor = (status: string) => {
  const upperStatus = String(status).toUpperCase();
  return statusColors[upperStatus] || 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300';
};

export const getStatusLabel = (status: string) => {
  const upperStatus = String(status).toUpperCase();
  return statusLabels[upperStatus] || status;
};
