import { link } from './config';

// Universal API helper for authenticated requests
export const BASE_URL = link;

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('access');
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Only set 'Content-Type' if it's not FormData and not already set
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Always use absolute URL
  const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
  
  try {
    const res = await fetch(fullUrl, { ...options, headers });

    // Handle 401 Unauthorized - redirect to login
    if (res.status === 401) {
      sessionStorage.removeItem('access');
      sessionStorage.removeItem('isAuth');
      window.location.href = '/login';
      return {};
    }
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      const error = new Error(data?.detail || data?.message || `HTTP ${res.status}: ${res.statusText}`) as Error & { response?: { data: unknown; status: number; statusText: string } };
      error.response = { data, status: res.status, statusText: res.statusText };
      throw error;
    }
    
    return data;
  } catch (error) {
    // Network errors or other fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error logged
      throw new Error('Tarmoq xatoligi. Internetga ulanishingizni tekshiring.');
    }
    throw error;
  }
}

// Generic API methods
export const get = (url: string) => apiFetch(url, { method: 'GET' });
export const post = (url: string, data?: unknown) => apiFetch(url, {
  method: 'POST',
  body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
});
export const put = (url: string, data?: unknown) => apiFetch(url, {
  method: 'PUT',
  body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
});
export const patch = (url: string, data?: unknown) => apiFetch(url, {
  method: 'PATCH',
  body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
});
export const del = (url: string) => apiFetch(url, { method: 'DELETE' });

// Raw fetch for endpoints that return a file blob instead of JSON (still shares auth/base-url logic)
function apiFetchRaw(url: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('access');
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
  return fetch(fullUrl, { ...options, headers });
}

// API endpoints
export const api = {
  // Auth
  login: (data: { username: string; password: string }) => post('/auth/login/', data),
  logout: () => post('/auth/logout/'),
  refreshToken: (refresh: string) => post('/auth/refresh/', { refresh }),
  
  // Profile
  getProfile: () => get('/profile/'),
  updateProfile: (data: Record<string, unknown>) => patch('/profile/', data),
  
  // Students
  getStudents: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    floor?: number;
    room?: number;
    faculty?: string;
    course?: number;
    group?: string;
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.floor) searchParams.append('floor', params.floor.toString());
    if (params?.room) searchParams.append('room', params.room.toString());
    if (params?.faculty) searchParams.append('faculty', params.faculty);
    if (params?.course) searchParams.append('course', params.course.toString());
    if (params?.group) searchParams.append('group', params.group);
    if (params?.status) searchParams.append('status', params.status);
    
    const queryString = searchParams.toString();
    return get(`/students/${queryString ? `?${queryString}` : ''}`);
  },
  
  createStudent: (data: Record<string, unknown>) => post('/student/create/', data),
  getStudent: (id: number | string) => get(`/students/${id}/`),
  updateStudent: (id: number | string, data: FormData | Record<string, unknown>) => patch(`/students/${id}/`, data),
  deleteStudent: (id: number | string) => del(`/students/${id}/`),
  getUnassignedStudents: () => get('/students/unassigned/'),
  
  // Floors and Rooms
  getFloors: () => get('/floors/'),
  getRooms: (floorId?: number | string) => get(`/rooms/${floorId ? `?floor=${floorId}` : ''}`),
  getAvailableRooms: (floorId: number | string) => get(`/available-rooms/?floor=${floorId}`),
  
  // Provinces and Districts
  getProvinces: () => get('/provinces/'),
  getDistricts: (provinceId?: number | string) => get(`/districts/${provinceId ? `?province=${provinceId}` : ''}`),
  
  // Payments
  getPayments: (params?: any) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    const queryString = searchParams.toString();
    return get(`/payments/${queryString ? `?${queryString}` : ''}`);
  },
  createPayment: (data: Record<string, unknown>) => post('/payments/create/', data),
  
  // Applications
  getApplications: (params?: any) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    const queryString = searchParams.toString();
    return get(`/applications/${queryString ? `?${queryString}` : ''}`);
  },
  getApplication: (id: number | string) => get(`/applications/${id}/`),
  updateApplication: (id: number | string, data: Record<string, unknown>) => patch(`/applications/${id}/`, data),
  approveApplication: (id: number | string, data: Record<string, unknown>) => patch(`/applications/${id}/approve/`, data),
  rejectApplication: (id: number | string, data: Record<string, unknown>) => put(`/applications/${id}/admin/`, data),
  deleteApplication: (id: number | string) => del(`/applications/${id}/`),
  
  // Leaders
  getLeaders: () => get('/leaders/'),
  createLeader: (data: {
    floor: number;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }) => post('/leaders/', data),
  
  // Floor Leaders
  getFloorLeaders: () => get('/floor-leaders/'),
  getFloorLeader: (id: number) => get(`/floor-leaders/${id}/`),
  createFloorLeader: (data: any) => post('/floor-leaders/', data),
  updateFloorLeader: (id: number, data: Record<string, unknown>) => patch(`/floor-leaders/${id}/`, data),
  deleteFloorLeader: (id: number) => del(`/floor-leaders/${id}/`),
  
  // Attendance Sessions
  getAttendanceSessions: (params?: {
    date?: string;
    floor?: number;
    page?: number;
    page_size?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.append('date', params.date);
    if (params?.floor) searchParams.append('floor', params.floor.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    
    const queryString = searchParams.toString();
    return get(`/attendance-sessions/${queryString ? `?${queryString}` : ''}`);
  },
  
  createAttendanceSession: (data: {
    floor: number;
    date: string;
    students: Array<{
      student_id: number;
      is_present: boolean;
      reason?: string;
    }>;
  }) => post('/attendance-sessions/', data),
  
  updateAttendanceSession: (id: number, data: Record<string, unknown>) => patch(`/attendance-sessions/${id}/`, data),
  deleteAttendanceSession: (id: number) => del(`/attendance-sessions/${id}/`),
  
  // Attendance Records
  getAttendanceRecords: (params?: {
    session?: number;
    student?: number;
    status?: string;
    page?: number;
    page_size?: number;
    date?: string; // Added date parameter
    floor?: number; // Added floor parameter
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.session) searchParams.append('session', params.session.toString());
    if (params?.student) searchParams.append('student', params.student.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.date) searchParams.append('date', params.date); // Append date to search params
    if (params?.floor) searchParams.append('floor', params.floor.toString()); // Append floor to search params
    
    const queryString = searchParams.toString();
    return get(`/attendance-records/${queryString ? `?${queryString}` : ''}`);
  },
  
  // Reports
  getReports: (params?: {
    start_date?: string;
    end_date?: string;
    floor?: number;
    type?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    if (params?.floor) searchParams.append('floor', params.floor.toString());
    if (params?.type) searchParams.append('type', params.type);
    
    const queryString = searchParams.toString();
    return get(`/reports/${queryString ? `?${queryString}` : ''}`);
  },
  
  // Settings
  getSettings: () => get('/settings/'),
  updateSettings: (data: Record<string, unknown>) => patch('/settings/', data),
  
  // Dashboard
  getDashboard: () => get('/dashboard/'),
  
  // Staff Management
  getStaff: (params?: {
    position?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.position) searchParams.append('position', params.position);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    
    const queryString = searchParams.toString();
    return get(`/staff/${queryString ? `?${queryString}` : ''}`);
  },
  createStaff: (data: FormData) => post('/staff/', data),
  updateStaff: (id: number | string, data: FormData | Record<string, unknown>) => patch(`/staff/${id}/`, data),
  deleteStaff: (id: number | string) => del(`/staff/${id}/`),
  
  // Additional Notification Methods
  markApplicationNotificationAsRead: (id: number) => patch(`/notifications/${id}/`, { is_read: true }),
  markAllApplicationNotificationsAsRead: () => post('/notifications/mark-all-read/', {}),
  
  // Dormitory Management
  patchMyDormitory: (data: Record<string, unknown>) => patch('/dormitory/', data),
  updateMyDormitory: (data: Record<string, unknown>) => {
    const formData = new FormData();

    // Convert data to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          // For arrays (like amenities), append each item
          value.forEach(item => formData.append(key, String(item)));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return patch('/admin/my-dormitory/', formData);
  },
  
  // Amenities Management
  getAmenities: () => get('/amenities/'),
  createAmenity: (data: { name: string; is_active: boolean }) => post('/amenities/', data),
  updateAmenity: (id: number, data: { name: string; is_active: boolean }) => patch(`/amenities/${id}/`, data),
  deleteAmenity: (id: number) => del(`/amenities/${id}/`),
  
  // Rules Management
  getRules: () => get('/rules/'),
  createRule: (data: { rule: string }) => post('/rules/', data),
  updateRule: (id: number, data: { rule: string }) => patch(`/rules/${id}/`, data),
  deleteRule: (id: number) => del(`/rules/${id}/`),
  
  // Dormitory Images
  getDormitoryImages: () => get('/dormitory-images/'),
  uploadDormitoryImage: (data: FormData) => post('/dormitory-images/', data),
  deleteDormitoryImage: (id: number) => del(`/dormitory-images/${id}/`),
  
  // Notifications
  getNotifications: async () => {
    try {
      const res = await get('/notifications/');
      return res.results || res || [];
    } catch (error) {
      return [];
    }
  },
  
  markNotificationAsRead: async (id: number) => {
    try {
      return await patch(`/notifications/${id}/`, { is_read: true });
    } catch (error) {
      // Fallback to alternative endpoint
      try {
        return await post('/notifications/mark-read/', { notification_id: id });
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
  },
  
  markAllNotificationsAsRead: async () => {
    try {
      return await post('/notifications/mark-all-read/', {});
    } catch (error) {
      throw error;
    }
  },
  
  // Export functions (return raw Response — caller reads the file blob)
  exportStudents: () => apiFetchRaw('/export-student/'),
  exportPayments: () => apiFetchRaw('/export-payment/'),

  // Admin profile endpoints
  getAdminProfile: () => get(`${BASE_URL}/profile/`),

  updateAdminProfile: (data: unknown) => patch('/profile/', data),
};

export default api;
