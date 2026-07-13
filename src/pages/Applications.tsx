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
    backgroundColor: 'transparent',
    borderColor: state.isFocused ? '#14b8a6' : 'transparent',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#14b8a6',
    },
    borderRadius: '0.75rem',
    padding: '2px 4px',
    cursor: 'pointer',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
    borderRadius: '1rem',
    overflow: 'hidden',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid ' + (document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'),
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#14b8a6'
      : state.isFocused
        ? (document.documentElement.classList.contains('dark') ? '#1e293b' : '#f1f5f9')
        : 'transparent',
    color: state.isSelected
      ? '#ffffff'
      : (document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b'),
    padding: '10px 16px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#14b8a6',
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
    fontWeight: '500',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#94a3b8',
  }),
};

const statusFilterOptions = [
  { value: 'PENDING', label: 'Yangi arizalar' },
  { value: 'APPROVED', label: 'Qabul qilingan' },
  { value: 'REJECTED', label: 'Rad etilgan' },
  { value: 'CONVERTED', label: 'Talabaga aylantirilgan' },
  { value: '', label: 'Barcha arizalar' },
];

// Status labels for display
const statusLabels: Record<string, string> = {
  'PENDING': 'Yangi',
  'APPROVED': 'Qabul qilindi',
  'REJECTED': 'Rad etilgan',
  'CONVERTED': 'Talabaga aylantirilgan',
  'Yangi': 'Yangi',
  'Qabul qilindi': 'Qabul qilindi',
  'Rad etilgan': 'Rad etilgan',
  'Pending': 'Yangi',
  'Approved': 'Qabul qilindi',
  'Rejected': 'Rad etilgan',
  'Converted': 'Talabaga aylantirilgan',
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
  const [statusFilter, setStatusFilter] = useState<string>('PENDING'); // Default to PENDING
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

  // Fetch floors for convert modal
  const { data: floorsData } = useQuery({
    queryKey: ['floors'],
    queryFn: () => api.getFloors(),
  });

  const floors: Floor[] = (floorsData?.results || floorsData || []) as Floor[];

  // Fetch rooms based on selected floor
  const { data: roomsData } = useQuery({
    queryKey: ['rooms', convertForm.floor],
    queryFn: () => api.getRooms(convertForm.floor),
    enabled: !!convertForm.floor,
  });

  const rooms: RoomOption[] = (roomsData?.results || roomsData || []) as RoomOption[];

  React.useEffect(() => {
    const handleApplicationUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    };

    window.addEventListener('application-updated', handleApplicationUpdate);

    return () => {
      window.removeEventListener('application-updated', handleApplicationUpdate);
    };
  }, [queryClient]);

  // API dan arizalarni olish
  const { data: applicationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const data = (await api.getApplications()) as ApplicationsResponse | Record<string, unknown>[];
      const results = Array.isArray(data) ? data : (data?.results ?? []);

      return results.map((app) => ({
        id: app.id,
        name: app.name,
        last_name: app.last_name,
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
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const applications: Application[] = applicationsData || [];

  // Listen for global application updates
  React.useEffect(() => {
    const handleApplicationUpdate = () => {
      refetch();
    };
    window.addEventListener('application-updated', handleApplicationUpdate);
    return () => {
      window.removeEventListener('application-updated', handleApplicationUpdate);
    };
  }, [refetch]);

  // Open convert modal with application data
  const openConvertModal = (app: Application) => {
    setSelectedAppForConvert(app);
    setConvertForm({ floor: '', room: '' });
    setShowConvertModal(true);
  };

  // Handle floor selection
  const handleFloorChange = (floorId: string) => {
    setConvertForm(prev => ({ ...prev, floor: floorId, room: '' }));
  };

  // Handle room selection
  const handleRoomChange = (roomId: string) => {
    setConvertForm(prev => ({ ...prev, room: roomId }));
  };

  // Convert application to student with floor and room
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

      // Close modal and refresh
      setShowConvertModal(false);
      setSelectedAppForConvert(null);
      setConvertForm({ floor: '', room: '' });

      // Refresh applications and students list
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      await refetch();

      // Emit global event for student update
      window.dispatchEvent(new CustomEvent('student-updated', { detail: { action: 'created', data: result } }));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Arizani talabaga aylantirishda xatolik yuz berdi';
      toast.error(errorMessage);
    } finally {
      setConvertingApp(null);
    }
  };

  // Delete application function
  const handleDeleteApplication = async (id: string | number) => {
    setDeletingApp(id);
    try {
      await api.deleteApplication(id);
      toast.success('Ariza muvaffaqiyatli o\'chirildi');
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      await refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Arizani o\'chirishda xatolik yuz berdi';
      toast.error(errorMessage);
    } finally {
      setDeletingApp(null);
      setShowDeleteConfirm({ show: false, id: null });
    }
  };

  // Filter API data with proper type safety and sort by newest first
  const filteredApps = applications
    .filter((app) => {
      const searchLower = search.toLowerCase();

      // Qidiruv - faqat ism va telefon bo'yicha
      const nameMatch = !search || (
        (app.name || '').toLowerCase().includes(searchLower) ||
        (app.last_name || '').toLowerCase().includes(searchLower) ||
        (app.middle_name || '').toLowerCase().includes(searchLower) ||
        (app.phone || '').toString().includes(searchLower)
      );

      // Status filter
      const statusMatch = !statusFilter || normalizeStatus(app.status) === normalizeStatus(statusFilter);

      // Gender filter
      const genderMatch = !genderFilter ||
        app.gender?.toLowerCase() === genderFilter.toLowerCase();

      // Faculty filter
      const facultyMatch = !facultyFilter ||
        app.faculty?.toLowerCase() === facultyFilter.toLowerCase();

      // Course filter
      const courseMatch = !courseFilter ||
        app.course === courseFilter;

      // Region filter
      const regionMatch = !regionFilter ||
        app.province_name === regionFilter;

      return nameMatch && statusMatch && genderMatch && facultyMatch && courseMatch && regionMatch;
    })
    .sort((a, b) => {
      // Eng yangisi tepada bo'lishi uchun created_at bo'yicha saralash
      const dateA = new Date(a.created_at || a.date || 0).getTime();
      const dateB = new Date(b.created_at || b.date || 0).getTime();
      return dateB - dateA; // Eng yangi birinchi
    });

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
        <Skeleton className="h-9 w-48 mb-6" />
        <Skeleton className="h-24 w-full rounded-2xl mb-6" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full rounded-2xl" count={4} />
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Arizalar
          </h1>
          <p className="text-surface-600 dark:text-surface-400 text-sm mt-1">
            Tizimdagi barcha kelib tushgan arizalar
          </p>
        </div>

        <div className="flex items-center gap-4 px-4 py-2 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
          <div className="text-right">
            <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Jami</span>
            <p className="text-lg font-bold text-surface-900 dark:text-white">{applications.length}</p>
          </div>
          <div className="w-px h-8 bg-surface-200 dark:bg-surface-700"></div>
          <div className="text-right">
            <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Saralandi</span>
            <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{filteredApps.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 p-4 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-surface-400" />
              </div>
              <input
                type="text"
                placeholder="Ism, familiya yoki telefon..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent"
              />
            </div>

            {/* Status Select */}
            <div className="lg:w-64">
              <Select
                options={statusFilterOptions}
                value={statusFilterOptions.find(opt => opt.value === statusFilter)}
                onChange={(opt) => setStatusFilter(opt?.value || '')}
                styles={selectStyles}
                placeholder="Holatni tanlang"
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              className="px-4 py-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors duration-150 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              title="Yangilash"
            >
              <Filter className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Yangilash</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gender Filter */}
            <Select
              options={genderOptions}
              value={genderOptions.find(opt => opt.value === genderFilter)}
              onChange={(opt) => setGenderFilter(opt?.value || '')}
              styles={selectStyles}
              placeholder="Jinsni tanlang"
            />

            {/* Faculty Filter */}
            <Select
              options={facultyOptions}
              value={facultyOptions.find(opt => opt.value === facultyFilter)}
              onChange={(opt) => setFacultyFilter(opt?.value || '')}
              styles={selectStyles}
              placeholder="Fakultetni tanlang"
            />

            {/* Course Filter */}
            <Select
              options={courseOptions}
              value={courseOptions.find(opt => opt.value === courseFilter)}
              onChange={(opt) => setCourseFilter(opt?.value || '')}
              styles={selectStyles}
              placeholder="Kursni tanlang"
            />

            {/* Region Filter */}
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

      {/* Applications List */}
      <div className="grid grid-cols-1 gap-4 pb-10">
        {filteredApps.length === 0 ? (
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
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
