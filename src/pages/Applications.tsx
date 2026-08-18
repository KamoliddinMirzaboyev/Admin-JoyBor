import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Building, Home, ChevronRight, Filter, Search, User, UserPlus, Calendar, Phone as PhoneIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Select, { StylesConfig } from 'react-select';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../data/api';
import Skeleton from '../components/UI/Skeleton';
import EmptyState from '../components/UI/EmptyState';

interface Application {
  id: string | number;
  name?: string;
  last_name?: string;
  middle_name?: string;
  phone: string | number;
  date?: string;
  created_at?: string;
  status: string;
  gender?: string;
  city?: string;
  province?: {
    id: number;
    name: string;
  };
  province_name?: string;
  district?: {
    id: number;
    name: string;
    province: number;
  };
  district_name?: string;
  faculty?: string;
  direction?: string;
  course?: string;
  group?: string;
  passport?: string;
  admin_comment?: string;
  comment?: string;
  dormitory?: {
    id: number;
    name: string;
  };
  dormitory_name?: string;
  user_image?: string;
  passport_image_first?: string;
  passport_image_second?: string;
  document?: string;
  user_info?: {
    id: number;
    username: string;
    role: string;
    email: string;
  };
  user?: number;
}

interface ApplicationsResponse {
  results?: Record<string, unknown>[];
}

interface Floor {
  id: number | string;
  name: string;
}

interface RoomOption {
  id: number | string;
  name: string;
}

interface SelectOption {
  value: string;
  label: string;
}

// Ariza statusini bitta kanonik qiymatga keltirish
type CanonicalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED' | 'UNKNOWN';

const normalizeStatus = (status: string): CanonicalStatus => {
  if (status === 'PENDING' || status === 'Pending' || status === 'Yangi') return 'PENDING';
  if (status === 'APPROVED' || status === 'Approved' || status === 'Qabul qilindi') return 'APPROVED';
  if (status === 'REJECTED' || status === 'Rejected' || status === 'Rad etilgan') return 'REJECTED';
  if (status === 'CONVERTED' || status === 'Converted' || status === 'Talabaga aylantirilgan') return 'CONVERTED';
  return 'UNKNOWN';
};

// Status badge — semantic ranglar: pending=warning, approved=success, rejected=danger, converted=info
const getStatusBadgeClasses = (status: string): string => {
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

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#f8fafc',
    borderColor: state.isFocused ? '#2563eb' : (document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0'),
    boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#2563eb' : (document.documentElement.classList.contains('dark') ? '#475569' : '#cbd5e1'),
    },
    borderRadius: '0.5rem',
    padding: '1px 2px',
    cursor: 'pointer',
    minHeight: '40px',
    fontSize: '0.875rem',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid ' + (document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0'),
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2563eb'
      : state.isFocused
        ? (document.documentElement.classList.contains('dark') ? '#334155' : '#eff6ff')
        : 'transparent',
    color: state.isSelected
      ? '#ffffff'
      : (document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b'),
    padding: '8px 14px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#2563eb',
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
    fontWeight: '500',
    fontSize: '0.875rem',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#94a3b8',
    fontSize: '0.875rem',
  }),
};

const statusFilterOptions = [
  { value: 'PENDING', label: 'Yangi arizalar' },
  { value: 'APPROVED', label: 'Qabul qilingan' },
  { value: 'REJECTED', label: 'Rad etilgan' },
  { value: 'CONVERTED', label: 'Talabaga aylantirilgan' },
  { value: '', label: 'Barcha arizalar' },
];

const statusLabels: Record<string, string> = {
  'PENDING': 'Yangi',
  'APPROVED': 'Qabul qilindi',
  'REJECTED': 'Rad etilgan',
  'CONVERTED': 'Talabaga aylantirilgan',
};

const facultyOptions = [
  { value: 'ATT', label: 'ATT' },
  { value: 'Informatika', label: 'Informatika' },
  { value: 'Iqtisodiyot', label: 'Iqtisodiyot' },
  { value: 'Muhandislik', label: 'Muhandislik' },
  { value: '', label: 'Barcha fakultetlar' },
];
const regionOptions = [
  { value: 'Farg‘ona viloyati', label: 'Farg‘ona' },
  { value: 'Toshkent viloyati', label: 'Toshkent viloyati' },
  { value: 'Toshkent shahri', label: 'Toshkent shahri' },
  { value: 'Andijon viloyati', label: 'Andijon' },
  { value: 'Samarqand viloyati', label: 'Samarqand' },
  { value: 'Namangan viloyati', label: 'Namangan' },
  { value: 'Buxoro viloyati', label: 'Buxoro' },
  { value: '', label: 'Barcha viloyatlar' },
];

const genderOptions = [
  { value: 'Erkak', label: 'Erkak' },
  { value: 'Ayol', label: 'Ayol' },
  { value: '', label: 'Barcha jinslar' },
];

const courseOptions = [
  { value: '1-kurs', label: '1-kurs' },
  { value: '2-kurs', label: '2-kurs' },
  { value: '3-kurs', label: '3-kurs' },
  { value: '4-kurs', label: '4-kurs' },
  { value: '', label: 'Barcha kurslar' },
];

const Applications: React.FC = () => {
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [facultyFilter, setFacultyFilter] = useState<string>('');
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedAppForConvert, setSelectedAppForConvert] = useState<Application | null>(null);
  const [convertForm, setConvertForm] = useState({
    floor: '',
    room: ''
  });
  const [convertingApp, setConvertingApp] = useState<string | number | null>(null);
  const [deletingApp, setDeletingApp] = useState<string | number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ show: boolean; id: string | number | null }>({ show: false, id: null });

  const queryClient = useQueryClient();

  const { data: floorsData } = useQuery({
    queryKey: ['floors'],
    queryFn: () => api.getFloors(),
  });

  const floors: Floor[] = (floorsData?.results || floorsData || []) as Floor[];

  const { data: roomsData } = useQuery({
    queryKey: ['rooms', convertForm.floor],
    queryFn: () => api.getRooms(convertForm.floor),
    enabled: !!convertForm.floor,
  });

  const rooms: RoomOption[] = (roomsData?.results || roomsData || []) as RoomOption[];

  const { data: applicationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const data = (await api.getApplications()) as ApplicationsResponse | Record<string, unknown>[];
      const results = Array.isArray(data) ? data : (data?.results ?? []);
      return results.map((app) => ({
        id: app.id,
        name: app.name,
        last_name: app.last_name,
        gender: app.gender,
        middle_name: app.middle_name,
        phone: app.phone,
        created_at: app.created_at,
        status: app.status,
        province_name: app.province_name,
        district_name: app.district_name,
        faculty: app.faculty,
        direction: app.direction,
        course: app.course,
        group: app.group,
        passport: app.passport,
        comment: app.comment,
        dormitory_name: app.dormitory_name,
        user_image: app.user_image,
        passport_image_first: app.passport_image_first,
        passport_image_second: app.passport_image_second,
        document: app.document,
        user_info: app.user_info,
        user: app.user,
        dormitory: app.dormitory,
        province: app.province,
        district: app.district,
      } as Application));
    },
    staleTime: 0,
  });

  const applications: Application[] = applicationsData || [];

  const handleConvertToStudent = async () => {
    if (!selectedAppForConvert || !convertForm.floor || !convertForm.room) {
      toast.error('Qavat va xona tanlash shart!');
      return;
    }

    setConvertingApp(selectedAppForConvert.id);
    try {
      const formData = new FormData();
      formData.append('application_id', String(selectedAppForConvert.id));
      formData.append('floor', convertForm.floor);
      formData.append('room', convertForm.room);
      formData.append('is_active', 'true');

      const result = await api.createStudent(formData);
      toast.success('Ariza muvaffaqiyatli talabaga aylantirildi!');

      setShowConvertModal(false);
      setSelectedAppForConvert(null);
      setConvertForm({ floor: '', room: '' });

      refetch();
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      window.dispatchEvent(new CustomEvent('student-updated', { detail: { action: 'created', data: result } }));
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: Record<string, unknown> }; message?: string };
      const errorMessage =
        (errorObj?.response?.data && Object.values(errorObj.response.data).flat().join(', ')) ||
        errorObj?.message ||
        'Talabaga aylantirishda xatolik yuz berdi!';
      toast.error(errorMessage);
    } finally {
      setConvertingApp(null);
    }
  };

  const handleDeleteApplication = async (id: string | number) => {
    setDeletingApp(id);
    try {
      await api.deleteApplication(id);
      toast.success('Ariza muvaffaqiyatli o\'chirildi!');
      setShowDeleteConfirm({ show: false, id: null });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: Record<string, unknown> }; message?: string };
      const errorMessage =
        (errorObj?.response?.data && Object.values(errorObj.response.data).flat().join(', ')) ||
        errorObj?.message ||
        'Arizani o\'chirishda xatolik yuz berdi!';
      toast.error(errorMessage);
    } finally {
      setDeletingApp(null);
    }
  };

  const filteredApps = applications.filter(app => {
    if (search) {
      const searchLower = search.toLowerCase();
      const name = (app.name || '').toLowerCase();
      const lastName = (app.last_name || '').toLowerCase();
      const phone = String(app.phone || '').toLowerCase();
      const fullName = `${name} ${lastName}`.trim();
      const reverseFullName = `${lastName} ${name}`.trim();

      const matchesSearch =
        name.includes(searchLower) ||
        lastName.includes(searchLower) ||
        fullName.includes(searchLower) ||
        reverseFullName.includes(searchLower) ||
        phone.includes(searchLower);

      if (!matchesSearch) return false;
    }

    if (statusFilter) {
      const canonicalStatus = normalizeStatus(app.status);
      if (canonicalStatus !== statusFilter) return false;
    }

    if (genderFilter && app.gender !== genderFilter) return false;
    if (facultyFilter && app.faculty !== facultyFilter) return false;
    if (courseFilter && app.course !== courseFilter) return false;

    if (regionFilter) {
      const provName = app.province_name || app.province?.name || '';
      if (!provName.toLowerCase().includes(regionFilter.toLowerCase())) return false;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 w-full">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-10 text-danger-600 dark:text-danger-400">
        Ma'lumotlarni yuklashda xatolik yuz berdi.
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white">
            Arizalar
          </h1>
          <p className="text-surface-500 dark:text-surface-400 text-xs sm:text-sm mt-0.5">
            Tizimdagi barcha kelib tushgan talabalar arizalari
          </p>
        </div>

        <div className="flex items-center gap-4 px-4 py-2 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Jami</span>
            <p className="text-base sm:text-lg font-bold text-surface-900 dark:text-white leading-tight">{applications.length}</p>
          </div>
          <div className="w-px h-6 bg-surface-200 dark:border-surface-700"></div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Saralandi</span>
            <p className="text-base sm:text-lg font-bold text-brand-600 dark:text-brand-400 leading-tight">{filteredApps.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-4 sm:p-5">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-surface-400" />
              </div>
              <input
                type="text"
                placeholder="Ism, familiya yoki telefon orqali qidirish..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-900 dark:text-white placeholder-surface-400 outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="lg:w-64">
              <Select
                options={statusFilterOptions}
                value={statusFilterOptions.find(opt => opt.value === statusFilter)}
                onChange={(opt) => setStatusFilter(opt?.value || '')}
                styles={selectStyles}
                placeholder="Holatni tanlang"
              />
            </div>

            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0"
              title="Yangilash"
            >
              <Filter className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Yangilash</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <Select
              options={genderOptions}
              value={genderOptions.find(opt => opt.value === genderFilter)}
              onChange={(opt) => setGenderFilter(opt?.value || '')}
              styles={selectStyles}
              placeholder="Jinsni tanlang"
            />
            <Select
              options={facultyOptions}
              value={facultyOptions.find(opt => opt.value === facultyFilter)}
              onChange={(opt) => setFacultyFilter(opt?.value || '')}
              styles={selectStyles}
              placeholder="Fakultetni tanlang"
            />
            <Select
              options={courseOptions}
              value={courseOptions.find(opt => opt.value === courseFilter)}
              onChange={(opt) => setCourseFilter(opt?.value || '')}
              styles={selectStyles}
              placeholder="Kursni tanlang"
            />
            <Select
              options={regionOptions}
              value={regionOptions.find(opt => opt.value === regionFilter)}
              onChange={(opt) => setRegionFilter(opt?.value || '')}
              styles={selectStyles}
              placeholder="Viloyatni tanlang"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pb-10">
        {filteredApps.length === 0 ? (
          <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-8 shadow-sm">
            <EmptyState
              icon={Search}
              title="Arizalar topilmadi"
              description="Tanlangan filter bo'yicha arizalar mavjud emas"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredApps.map((app: Application, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-colors duration-150"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Profile Section */}
                    <div className="relative flex-shrink-0">
                      {app.user_image ? (
                        <img
                          src={app.user_image}
                          alt={app.name}
                          className="w-14 h-14 rounded-xl object-cover border border-surface-200 dark:border-surface-700"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-brand-600 rounded-xl flex items-center justify-center text-white">
                          <span className="text-lg font-semibold">
                            {(app.last_name?.[0] || '') + (app.name?.[0] || '') || <User className="w-6 h-6" />}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-base font-semibold text-surface-900 dark:text-white truncate">
                          {`${app.last_name || ''} ${app.name || ''}`.trim() || `Ariza #${app.id}`}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(app.status)}`}>
                          {statusLabels[app.status] || app.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-surface-600 dark:text-surface-400">
                        <div className="flex items-center gap-1.5">
                          <PhoneIcon className="w-4 h-4 text-surface-400" />
                          <span>{app.phone || 'Noma\'lum'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-surface-400" />
                          <span>
                            {app.created_at ? new Date(app.created_at).toLocaleDateString('uz-UZ') : 'Noma\'lum'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-4 mt-3 text-sm">
                        <div className="text-surface-600 dark:text-surface-400">
                          <span className="text-surface-400 dark:text-surface-500">{app.province_name || app.province?.name || '-'}</span>
                        </div>
                        <div className="text-surface-400">|</div>
                        <div className="text-surface-600 dark:text-surface-400">
                          <span className="text-surface-400 dark:text-surface-500">{app.faculty || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                    <Link
                      to={`/applications/${app.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                    >
                      <span>Ko'rish</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>

                    {normalizeStatus(app.status) === 'PENDING' && (
                      <button
                        onClick={() => openConvertModal(app)}
                        disabled={convertingApp === app.id}
                        className="px-3 py-2 rounded-xl bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-600 hover:text-white transition-colors duration-150 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                        title="Talabalar ro'yhatiga qo'shish"
                      >
                        {convertingApp === app.id ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => setShowDeleteConfirm({ show: true, id: app.id })}
                      disabled={deletingApp === app.id}
                      className="px-3 py-2 rounded-xl bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 hover:bg-danger-600 hover:text-white transition-colors duration-150 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                      title="O'chirish"
                    >
                      {deletingApp === app.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-8 w-full max-w-md border border-surface-200 dark:border-surface-800 text-center"
            >
              <div className="w-20 h-20 bg-danger-50 dark:bg-danger-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-danger-500">
                <Trash2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-3">Arizani o'chirish?</h2>
              <p className="text-surface-500 dark:text-surface-400 mb-8 font-medium">
                Siz haqiqatan ham ushbu arizani tizimdan butunlay o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm({ show: false, id: null })}
                  className="flex-1 py-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 font-bold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={() => showDeleteConfirm.id && handleDeleteApplication(showDeleteConfirm.id)}
                  className="flex-1 py-3 rounded-xl bg-danger-600 text-white font-bold hover:bg-danger-700 transition-colors duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                >
                  O'chirish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Convert to Student Modal */}
      <AnimatePresence>
        {showConvertModal && selectedAppForConvert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-8 w-full max-w-lg border border-surface-200 dark:border-surface-800"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-success-50 dark:bg-success-900/20 rounded-2xl flex items-center justify-center text-success-500">
                  <UserPlus className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-surface-900 dark:text-white">Talabaga aylantirish</h2>
                  <p className="text-surface-500 dark:text-surface-400 text-sm">
                    Ariza ma'lumotlarini tekshirib, qavat va xona tanlang
                  </p>
                </div>
              </div>

              {/* Application Info Card */}
              <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-4 mb-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg">
                    {(selectedAppForConvert.last_name?.[0] || '') + (selectedAppForConvert.name?.[0] || '')}
                  </div>
                  <div>
                    <p className="font-bold text-surface-900 dark:text-white">
                      {selectedAppForConvert.last_name} {selectedAppForConvert.name}
                    </p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">{selectedAppForConvert.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white dark:bg-surface-700 rounded-xl p-3">
                    <p className="text-surface-400 dark:text-surface-500 text-xs uppercase font-bold mb-1">Fakultet</p>
                    <p className="text-surface-900 dark:text-white font-medium truncate">{selectedAppForConvert.faculty || '-'}</p>
                  </div>
                  <div className="bg-white dark:bg-surface-700 rounded-xl p-3">
                    <p className="text-surface-400 dark:text-surface-500 text-xs uppercase font-bold mb-1">Yo'nalish</p>
                    <p className="text-surface-900 dark:text-white font-medium truncate">{selectedAppForConvert.direction || '-'}</p>
                  </div>
                  <div className="bg-white dark:bg-surface-700 rounded-xl p-3">
                    <p className="text-surface-400 dark:text-surface-500 text-xs uppercase font-bold mb-1">Guruh</p>
                    <p className="text-surface-900 dark:text-white font-medium">{selectedAppForConvert.group || '-'}</p>
                  </div>
                  <div className="bg-white dark:bg-surface-700 rounded-xl p-3">
                    <p className="text-surface-400 dark:text-surface-500 text-xs uppercase font-bold mb-1">Kurs</p>
                    <p className="text-surface-900 dark:text-white font-medium">{selectedAppForConvert.course || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Floor and Room Selection */}
              <div className="space-y-4 mb-6">
                {/* Floor Selection */}
                <div>
                  <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                    <Building className="w-4 h-4 inline mr-1" />
                    Qavat *
                  </label>
                  <Select
                    options={floors.map((f) => ({ value: String(f.id), label: f.name }))}
                    value={floors.find((f) => String(f.id) === convertForm.floor)
                      ? { value: convertForm.floor, label: floors.find((f) => String(f.id) === convertForm.floor)?.name || '' }
                      : null
                    }
                    onChange={(opt) => handleFloorChange(opt?.value || '')}
                    placeholder="Qavat tanlang"
                    styles={selectStyles}
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Room Selection */}
                <div>
                  <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                    <Home className="w-4 h-4 inline mr-1" />
                    Xona *
                  </label>
                  <Select
                    options={rooms.map((r) => ({ value: String(r.id), label: r.name }))}
                    value={rooms.find((r) => String(r.id) === convertForm.room)
                      ? { value: convertForm.room, label: rooms.find((r) => String(r.id) === convertForm.room)?.name || '' }
                      : null
                    }
                    onChange={(opt) => handleRoomChange(opt?.value || '')}
                    placeholder={convertForm.floor ? "Xona tanlang" : "Avval qavat tanlang"}
                    isDisabled={!convertForm.floor}
                    styles={selectStyles}
                    classNamePrefix="react-select"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowConvertModal(false);
                    setSelectedAppForConvert(null);
                    setConvertForm({ floor: '', room: '' });
                  }}
                  className="flex-1 py-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 font-bold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleConvertToStudent}
                  disabled={!convertForm.floor || !convertForm.room || convertingApp === selectedAppForConvert.id}
                  className="flex-1 py-3 rounded-xl bg-success-600 text-white font-bold hover:bg-success-700 transition-colors duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                >
                  {convertingApp === selectedAppForConvert.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Aylantirilmoqda...
                    </span>
                  ) : (
                    "Talabalar ro'yhatiga qo'shish"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Applications;
