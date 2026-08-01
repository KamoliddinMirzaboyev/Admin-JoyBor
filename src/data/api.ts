import { link } from './config';

export const BASE_URL = link;

function buildHeaders(options: RequestInit = {}, withJson = true): Record<string, string> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (withJson && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const token = sessionStorage.getItem('access');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function clearAuthAndRedirect() {
  sessionStorage.removeItem('access');
  sessionStorage.removeItem('refresh');
  sessionStorage.removeItem('isAuth');
  sessionStorage.removeItem('userRole');
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

async function tryRefreshToken(): Promise<boolean> {
  const refresh = sessionStorage.getItem('refresh');
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { access?: string };
    if (!data.access) return false;
    sessionStorage.setItem('access', data.access);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch(url: string, options: RequestInit = {}, retried = false): Promise<unknown> {
  const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
  const headers = buildHeaders(options);

  try {
    const res = await fetch(fullUrl, { ...options, headers });

    if (res.status === 401 && !retried) {
      const refreshed = await tryRefreshToken();
      if (refreshed) return apiFetch(url, options, true);
      clearAuthAndRedirect();
      return {};
    }

    if (res.status === 401) {
      clearAuthAndRedirect();
      return {};
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(
        (data as { detail?: string; message?: string })?.detail ||
          (data as { message?: string })?.message ||
          `HTTP ${res.status}: ${res.statusText}`
      ) as Error & { response?: { data: unknown; status: number; statusText: string } };
      err.response = { data, status: res.status, statusText: res.statusText };
      throw err;
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Tarmoq xatoligi. Internetga ulanishingizni tekshiring.");
    }
    throw error;
  }
}

export const get = (url: string) => apiFetch(url, { method: 'GET' });
export const post = (url: string, data?: unknown) =>
  apiFetch(url, {
    method: 'POST',
    body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
  });
export const put = (url: string, data?: unknown) =>
  apiFetch(url, {
    method: 'PUT',
    body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
  });
export const patch = (url: string, data?: unknown) =>
  apiFetch(url, {
    method: 'PATCH',
    body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
  });
export const del = (url: string) => apiFetch(url, { method: 'DELETE' });

function apiFetchRaw(url: string, options: RequestInit = {}, retried = false): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
  const headers = buildHeaders(options, false);

  return fetch(fullUrl, { ...options, headers }).then(async (res) => {
    if (res.status === 401 && !retried) {
      const refreshed = await tryRefreshToken();
      if (refreshed) return apiFetchRaw(url, options, true);
      clearAuthAndRedirect();
    }
    return res;
  });
}

function qs(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  // Auth (JWT)
  login: (data: { username: string; password: string }) => post('/token/', data),
  refreshToken: (refresh: string) => post('/token/refresh/', { refresh }),
  logout: () => {
    sessionStorage.removeItem('access');
    sessionStorage.removeItem('refresh');
    sessionStorage.removeItem('isAuth');
    sessionStorage.removeItem('userRole');
    return Promise.resolve({});
  },

  // Profile
  getProfile: () => get('/me/'),
  updateProfile: (data: FormData | Record<string, unknown>) => patch('/me/', data),
  getAdminProfile: () => get('/me/'),
  updateAdminProfile: (data: unknown) => patch('/me/', data),

  // Dashboard
  getDashboard: () => get('/admin/dashboard/'),
  getFloorsStats: () => get('/admin/floors-stats/'),

  // Students
  getStudents: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    floor?: number;
    room?: number;
    faculty?: string;
    course?: number | string;
    group?: string;
    status?: string;
    gender?: string;
    placement_status?: string;
    is_active?: boolean;
    ordering?: string;
  }) => get(`/students/${qs(params)}`),

  getAdminStudents: (params?: Record<string, string | number | boolean | undefined>) =>
    get(`/admin/students/${qs(params)}`),

  createStudent: (data: FormData | Record<string, unknown>) => post('/students/create/', data),
  getStudent: (id: number | string) => get(`/students/${id}/`),
  updateStudent: (id: number | string, data: FormData | Record<string, unknown>) =>
    patch(`/students/${id}/`, data),
  deleteStudent: (id: number | string) => del(`/students/${id}/`),
  getUnassignedStudents: () => get('/students/unassigned/'),

  assignRoom: (studentId: number | string, data: { floor: number; room: number }) =>
    patch(`/students/${studentId}/assign-room/`, data),
  removeRoom: (studentId: number | string) => patch(`/students/${studentId}/remove-room/`, {}),
  transferRoom: (
    studentId: number | string,
    data: { new_floor: number; new_room: number; force?: boolean }
  ) => patch(`/students/${studentId}/transfer-room/`, data),

  // Floors & Rooms
  getFloors: () => get('/floors/'),
  createFloor: (data: Record<string, unknown>) => post('/floors/', data),
  updateFloor: (id: number | string, data: Record<string, unknown>) => patch(`/floors/${id}/`, data),
  deleteFloor: (id: number | string) => del(`/floors/${id}/`),

  getRooms: (floorId?: number | string) =>
    get(`/rooms/${floorId ? qs({ floor: floorId }) : ''}`),
  createRoom: (data: Record<string, unknown>) => post('/rooms/', data),
  updateRoom: (id: number | string, data: Record<string, unknown>) => patch(`/rooms/${id}/`, data),
  deleteRoom: (id: number | string) => del(`/rooms/${id}/`),

  // Provinces & Districts
  getProvinces: () => get('/provinces/'),
  getDistricts: (provinceId?: number | string) =>
    get(`/districts/${provinceId ? qs({ province: provinceId }) : ''}`),

  // Payments
  getPayments: (params?: {
    page?: number;
    student?: number | string;
    status?: string;
    method?: string;
    dormitory?: number | string;
    ordering?: string;
  }) => get(`/payments/${qs(params)}`),
  createPayment: (data: Record<string, unknown>) => post('/payments/create/', data),
  updatePayment: (id: number | string, data: Record<string, unknown>) =>
    patch(`/payments/${id}/`, data),
  deletePayment: (id: number | string) => del(`/payments/${id}/`),

  // Applications
  getApplications: (params?: {
    page?: number;
    search?: string;
    dormitory?: number | string;
    status?: string;
  }) => get(`/applications/${qs(params)}`),
  getApplication: (id: number | string) => get(`/applications/${id}/`),
  updateApplication: (id: number | string, data: Record<string, unknown>) =>
    patch(`/applications/${id}/`, data),
  approveApplication: (id: number | string, data: Record<string, unknown> = {}) =>
    patch(`/applications/${id}/approve/`, data),
  rejectApplication: (id: number | string, data: Record<string, unknown> = {}) =>
    patch(`/applications/${id}/reject/`, data),
  deleteApplication: (id: number | string) => del(`/applications/${id}/`),

  // Floor Leaders
  getLeaders: () => get('/floor-leaders/'),
  createLeader: (data: {
    floor: number;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  }) => post('/floor-leaders/', data),
  getFloorLeaders: () => get('/floor-leaders/'),
  getFloorLeader: (id: number) => get(`/floor-leaders/${id}/`),
  createFloorLeader: (data: Record<string, unknown>) => post('/floor-leaders/', data),
  updateFloorLeader: (id: number, data: Record<string, unknown>) =>
    patch(`/floor-leaders/${id}/`, data),
  deleteFloorLeader: (id: number) => del(`/floor-leaders/${id}/`),

  // Attendance
  getAttendanceSessions: (params?: {
    date?: string;
    floor?: number;
    page?: number;
    page_size?: number;
  }) => get(`/attendance-sessions/${qs(params)}`),

  createAttendanceSession: (data: Record<string, unknown>) =>
    post('/attendance-sessions/create/', data),

  fullCreateAttendanceSession: (data: {
    date?: string;
    records: Array<{ student_id: number; status: 'in' | 'out' }>;
  }) => post('/attendance-sessions/full-create/', data),

  updateAttendanceSession: (id: number, data: Record<string, unknown>) =>
    patch(`/attendance-sessions/${id}/`, data),
  deleteAttendanceSession: (id: number) => del(`/attendance-sessions/${id}/`),

  getAttendanceRecords: (params?: {
    session?: number;
    student?: number;
    status?: string;
    page?: number;
    page_size?: number;
    date?: string;
    floor?: number;
  }) => get(`/attendance-records/${qs(params)}`),

  updateAttendanceRecord: (id: number | string, data: Record<string, unknown>) =>
    patch(`/attendance-records/${id}/update/`, data),

  // Staff
  getStaff: (params?: {
    position?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
  }) => get(`/staff/${qs(params)}`),
  createStaff: (data: FormData) => post('/staff/', data),
  updateStaff: (id: number | string, data: FormData | Record<string, unknown>) =>
    patch(`/staff/${id}/`, data),
  deleteStaff: (id: number | string) => del(`/staff/${id}/`),

  getStaffAttendance: (params?: { page?: number; staff?: number; date?: string }) =>
    get(`/staff-attendance/${qs(params)}`),
  createStaffAttendance: (data: Record<string, unknown>) => post('/staff-attendance/', data),

  // Dormitory
  getMyDormitory: () => get('/admin/my-dormitory/'),
  getMyDormitories: (params?: { search?: string; is_active?: boolean; page?: number }) =>
    get(`/admin/my-dormitories/${qs(params)}`),
  patchMyDormitory: (data: Record<string, unknown> | FormData) =>
    patch('/admin/my-dormitory/', data),
  updateMyDormitory: (data: Record<string, unknown>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((item) => formData.append(key, String(item)));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    return patch('/admin/my-dormitory/', formData);
  },

  // Amenities
  getAmenities: () => get('/amenities/'),
  createAmenity: (data: { name: string; is_active?: boolean }) => post('/amenities/', data),
  updateAmenity: (id: number, data: { name?: string; is_active?: boolean }) =>
    patch(`/amenities/${id}/`, data),
  deleteAmenity: (id: number) => del(`/amenities/${id}/`),

  // Rules
  getRules: () => get('/rules/'),
  createRule: (data: { rule: string }) => post('/rules/', data),
  updateRule: (id: number, data: { rule: string }) => patch(`/rules/${id}/`, data),
  deleteRule: (id: number) => del(`/rules/${id}/`),

  // Dormitory images
  getDormitoryImages: () => get('/dormitory-images/'),
  uploadDormitoryImage: (data: FormData) => post('/dormitory-images/', data),
  deleteDormitoryImage: (id: number) => del(`/dormitory-images/${id}/`),

  // Admin notifications (create/manage)
  getAdminNotifications: (params?: { target_type?: string; is_active?: boolean; page?: number }) =>
    get(`/admin/notifications/${qs(params)}`),
  createAdminNotification: (data: {
    message: string;
    target_type?: string;
    target_user?: number;
    is_active?: boolean;
  }) => post('/admin/notifications/create/', data),
  updateAdminNotification: (id: number, data: Record<string, unknown>) =>
    patch(`/admin/notifications/${id}/`, data),
  deleteAdminNotification: (id: number) => del(`/admin/notifications/${id}/`),

  // User notifications (inbox)
  getNotifications: async () => {
    try {
      const res = (await get('/notifications/')) as
        | { results?: Array<Record<string, unknown>> }
        | Array<Record<string, unknown>>;
      const list = Array.isArray(res) ? res : res?.results || [];
      // normalize is_read / read field
      return list.map((n) => ({
        ...n,
        is_read: Boolean(n.is_read ?? n.read ?? n.isRead),
        message: String(n.message ?? n.title ?? n.content ?? ''),
        type: String(n.type ?? n.notification_type ?? 'info'),
        created_at: String(n.created_at ?? n.createdAt ?? new Date().toISOString()),
        id: Number(n.id),
      }));
    } catch {
      return [];
    }
  },
  getUnreadCount: () => get('/notifications/unread-count/'),
  markNotificationAsRead: (id: number) =>
    post('/notifications/mark-read/', { id, notification_id: id }),
  markAllNotificationsAsRead: () => post('/notifications/mark-all-read/', {}),
  markApplicationNotificationAsRead: (id: number) =>
    post('/notifications/mark-read/', { id, notification_id: id }),
  markAllApplicationNotificationsAsRead: () => post('/notifications/mark-all-read/', {}),

  // Complaints
  getComplaints: (params?: { status?: string; category?: string; page?: number }) =>
    get(`/complaints/${qs(params)}`),
  getComplaint: (id: number | string) => get(`/complaints/${id}/`),
  updateComplaint: (id: number | string, data: Record<string, unknown>) =>
    patch(`/complaints/${id}/`, data),

  // Collections (admin view)
  getCollections: (params?: { floor?: number; page?: number }) =>
    get(`/collections/${qs(params)}`),
  getCollection: (id: number | string) => get(`/collections/${id}/`),

  // Duty schedules
  getDutySchedules: (params?: { page?: number }) => get(`/duty-schedules/${qs(params)}`),
  createDutySchedule: (data: { date: string; floor: number; room: number }) =>
    post('/duty-schedules/', data),
  updateDutySchedule: (id: number | string, data: Record<string, unknown>) =>
    patch(`/duty-schedules/${id}/`, data),
  deleteDutySchedule: (id: number | string) => del(`/duty-schedules/${id}/`),

  // Tasks
  getTasks: (params?: { page?: number }) => get(`/tasks/${qs(params)}`),
  createTask: (data: { user: number; description?: string; reminder_date?: string }) =>
    post('/tasks/create/', data),
  updateTask: (id: number | string, data: Record<string, unknown>) => patch(`/tasks/${id}/`, data),
  deleteTask: (id: number | string) => del(`/tasks/${id}/`),

  getTasksForLeaders: (params?: { page?: number }) => get(`/tasks-for-leaders/${qs(params)}`),
  createTaskForLeader: (data: { user: number; description?: string }) =>
    post('/tasks-for-leaders/create/', data),

  // Export (blob)
  exportStudents: () => apiFetchRaw('/export/students/'),
  exportPayments: () => apiFetchRaw('/export/payments/'),

  // Universities (read)
  getUniversities: () => get('/universities/'),

  // Stats (public)
  getStats: () => get('/stats/'),
};

export default api;
