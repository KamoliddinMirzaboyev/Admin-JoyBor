import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Edit2,
  Trash2,
  X,
  Search,
  Filter,
  Users,
  User,
  Phone,
  Briefcase,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  FileText,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/UI/DataTable';
import EmptyState from '../components/UI/EmptyState';
import Skeleton from '../components/UI/Skeleton';
import api from '../data/api';

const ROLES_MAP: Record<string, string> = {
  manager: 'Boshqaruvchi',
  admin: 'Administrator',
  guard: 'Xavfsizlik xodimi',
  cleaner: 'Tozalik xodimi',
  technician: 'Texnik xodim',
  cook: 'Oshpaz',
};

const ROLES_OPTIONS = [
  { value: 'manager', label: 'Boshqaruvchi' },
  { value: 'admin', label: 'Administrator' },
  { value: 'guard', label: 'Xavfsizlik xodimi' },
  { value: 'cleaner', label: 'Tozalik xodimi' },
  { value: 'technician', label: 'Texnik xodim' },
  { value: 'cook', label: 'Oshpaz' },
];

interface StaffMember {
  id: number;
  name: string;
  last_name?: string;
  position: string;
  phone: string;
  salary: number | string;
  hired_date?: string;
  is_active: boolean;
  photo?: string | null;
}

interface StaffFormData {
  name: string;
  last_name: string;
  position: string;
  phone: string;
  salary: string;
  hired_date: string;
  is_active: boolean;
  photo: File | null;
  file: File | null;
}

const emptyForm: StaffFormData = {
  name: '',
  last_name: '',
  position: ROLES_OPTIONS[0].value,
  phone: '+998 ',
  salary: '',
  hired_date: new Date().toISOString().split('T')[0],
  is_active: true,
  photo: null,
  file: null,
};

// Format phone for display: +998 (XX) XXX-XX-XX
const formatPhoneDisplay = (val: string) => {
  const digits = val.replace(/\D/g, '');
  const d = digits.startsWith('998') ? digits.slice(3) : digits;
  if (!d) return '+998';
  let formatted = '+998';
  if (d.length > 0) formatted += ' (' + d.slice(0, 2);
  if (d.length >= 2) formatted += ') ' + d.slice(2, 5);
  if (d.length >= 5) formatted += '-' + d.slice(5, 7);
  if (d.length >= 7) formatted += '-' + d.slice(7, 9);
  return formatted;
};

const Staff: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<StaffFormData>(emptyForm);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  // Fetch staff list
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff', search, positionFilter],
    queryFn: () => api.getStaff({ search, position: positionFilter }),
  });

  // Xodim yaratishda backend `dormitory` maydonini talab qiladi (POST /staff/)
  const { data: myDormitory } = useQuery<{ id: number } | null>({
    queryKey: ['my-dormitory'],
    queryFn: () => api.getMyDormitory() as Promise<{ id: number }>,
    staleTime: 1000 * 60 * 10,
  });

  const staffList: StaffMember[] = Array.isArray(staffData)
    ? (staffData as StaffMember[])
    : Array.isArray((staffData as { results?: StaffMember[] })?.results)
    ? (staffData as { results: StaffMember[] }).results
    : [];

  // Summary metrics
  const totalStaffCount = staffList.length;
  const activeStaffCount = staffList.filter((s) => s.is_active).length;
  const totalSalarySum = staffList.reduce((acc, curr) => acc + (Number(curr.salary) || 0), 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0] ?? null;
      setFormData((prev) => ({ ...prev, [name]: file }));
      if (name === 'photo' && file) {
        setPhotoPreview(URL.createObjectURL(file));
      }
    } else if (name === 'phone') {
      setFormData((prev) => ({ ...prev, phone: formatPhoneDisplay(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Add/Edit mutation
  const saveMutation = useMutation({
    mutationFn: (data: StaffFormData) => {
      const form = new FormData();
      form.append('name', data.name);
      form.append('last_name', data.last_name);
      form.append('position', data.position);
      
      const cleanPhone = '+998' + data.phone.replace(/\D/g, '').slice(3);
      form.append('phone', cleanPhone.length > 4 ? cleanPhone : data.phone);
      form.append('salary', data.salary.toString().replace(/[^0-9]/g, ''));
      form.append('hired_date', data.hired_date);
      form.append('is_active', data.is_active.toString());

      if (data.photo instanceof File) form.append('photo', data.photo);
      if (data.file instanceof File) form.append('file', data.file);

      if (editStaff) {
        return api.updateStaff(editStaff.id, form);
      }

      if (myDormitory?.id) {
        form.append('dormitory', String(myDormitory.id));
      }
      return api.createStaff(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsModalOpen(false);
      setEditStaff(null);
      setFormData(emptyForm);
      setPhotoPreview(null);
      toast.success(editStaff ? "Xodim ma'lumotlari yangilandi" : "Yangi xodim qo'shildi");
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.detail ||
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.message ||
        "Xatolik yuz berdi. Qayta urinib ko'ring";
      toast.error(errorMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success("Xodim o'chirildi");
    },
    onError: () => {
      toast.error("O'chirishda xatolik yuz berdi");
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Haqiqatan ham bu xodimni o'chirmoqchimisiz?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenAddModal = () => {
    setEditStaff(null);
    setFormData(emptyForm);
    setPhotoPreview(null);
    setIsModalOpen(true);
  };

  const handleEdit = (staff: StaffMember) => {
    setEditStaff(staff);
    setFormData({
      name: staff.name,
      last_name: staff.last_name || '',
      position: staff.position,
      phone: formatPhoneDisplay(staff.phone || ''),
      salary: staff.salary.toString(),
      hired_date: staff.hired_date || new Date().toISOString().split('T')[0],
      is_active: staff.is_active,
      photo: null,
      file: null,
    });
    setPhotoPreview(staff.photo || null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Ismni kiriting');
      return;
    }
    saveMutation.mutate(formData);
  };

  const columns = [
    {
      key: 'name',
      title: 'Xodim',
      sortable: true,
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center gap-3">
          {row.photo ? (
            <img
              src={String(row.photo)}
              alt={String(row.name)}
              className="w-9 h-9 rounded-lg object-cover border border-surface-200 dark:border-surface-700"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xs border border-brand-200/60 dark:border-brand-800/60">
              {String(row.name)[0]}
              {String(row.last_name ?? '')[0] ?? ''}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-surface-900 dark:text-white text-sm">
              {String(row.name)} {String(row.last_name ?? '')}
            </span>
            <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-surface-400" />
              {String(row.phone || '-')}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      title: 'Lavozim',
      sortable: true,
      render: (value: unknown) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 border border-brand-200/60 dark:border-brand-800/40 px-2.5 py-0.5 rounded-md">
          <Briefcase className="w-3 h-3 text-brand-500" />
          {ROLES_MAP[String(value)] || String(value)}
        </span>
      ),
    },
    {
      key: 'salary',
      title: 'Maosh',
      sortable: true,
      render: (value: unknown) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-surface-900 dark:text-white">
            {Number(value || 0).toLocaleString('uz-UZ')}
          </span>
          <span className="text-[10px] text-surface-400 font-medium uppercase">so'm / oy</span>
        </div>
      ),
    },
    {
      key: 'hired_date',
      title: 'Ishga kirgan',
      sortable: true,
      render: (value: unknown) => (
        <span className="text-xs text-surface-600 dark:text-surface-400 font-medium">
          {value ? String(value) : '-'}
        </span>
      ),
    },
    {
      key: 'is_active',
      title: 'Holati',
      sortable: true,
      render: (value: unknown) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
            value
              ? 'bg-success-50 dark:bg-success-950/40 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800/60'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              value ? 'bg-success-500 animate-pulse' : 'bg-surface-400'
            }`}
          />
          {value ? 'Faol' : 'Nofaol'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Amallar',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row as unknown as StaffMember);
            }}
            className="p-1.5 text-surface-600 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors border border-surface-200 dark:border-surface-700"
            title="Tahrirlash"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(Number(row.id));
            }}
            className="p-1.5 text-surface-600 dark:text-surface-300 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 rounded-lg transition-colors border border-surface-200 dark:border-surface-700 hover:border-danger-200"
            title="O'chirish"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 flex flex-col">
      {/* Top Header Area */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-shrink-0 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/40 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-1.5">
              <Users className="w-3.5 h-3.5" />
              Xodimlar Boshqaruvi
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white tracking-tight">
              Xodimlar
            </h1>
            <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 mt-0.5">
              Yotoqxona xodimlari ro'yxati, lavozimlari, oylik maoshlari va faollik monitoringi
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium text-sm shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Xodim qo'shish</span>
          </button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">
                Jami xodimlar
              </p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">
                {totalStaffCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center border border-brand-200/60 dark:border-brand-800/40">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">
                Faol (Ishda)
              </p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {activeStaffCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-success-50 dark:bg-success-950/60 text-success-600 flex items-center justify-center border border-success-200/60 dark:border-success-800/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">
                Oylik maosh fondi
              </p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">
                {totalSalarySum.toLocaleString('uz-UZ')} <span className="text-xs font-normal text-surface-400">so'm</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-info-50 dark:bg-info-950/60 text-info-600 flex items-center justify-center border border-info-200/60 dark:border-info-800/40">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-surface-900 p-3 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Ism yoki telefon orqali qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-surface-50 dark:bg-surface-800/70 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="pl-9 pr-8 py-2 bg-surface-50 dark:bg-surface-800/70 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="">Barcha lavozimlar</option>
                {ROLES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-12">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm p-8 text-center">
            <EmptyState
              icon={Users}
              title="Xodimlar topilmadi"
              description="Qidiruv shartlarini o'zgartirib ko'ring yoki yangi xodim qo'shing."
            />
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Yangi xodim qo'shish</span>
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
            <DataTable
              data={staffList as unknown as Record<string, unknown>[]}
              columns={columns}
            />
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-surface-950/70 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="relative bg-white dark:bg-surface-900 w-full max-w-3xl rounded-xl shadow-xl border border-surface-200 dark:border-surface-800 overflow-hidden my-8 z-10"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50 dark:bg-surface-800/40">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200/60 dark:border-brand-800/60">
                    {editStaff ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                      {editStaff ? "Xodim ma'lumotlarini tahrirlash" : "Yangi xodim qo'shish"}
                    </h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      Asosiy ma'lumotlar va lavozim biriktiring
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-7 max-h-[75vh] overflow-y-auto">
                {/* Section: Shaxsiy ma'lumotlar */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-surface-800 dark:text-surface-100">
                    <User className="w-4 h-4 text-brand-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Shaxsiy ma'lumotlar</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                        Ismi *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          required
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Masalan: Sardor"
                          className="w-full pl-10 pr-3.5 py-3 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                        Familiyasi
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          placeholder="Masalan: Aliyev"
                          className="w-full pl-10 pr-3.5 py-3 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                        Telefon raqami
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+998 (90) 123-45-67"
                          className="w-full pl-10 pr-3.5 py-3 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Ish ma'lumotlari */}
                <div className="space-y-4 pt-6 border-t border-surface-100 dark:border-surface-800">
                  <div className="flex items-center gap-2 text-surface-800 dark:text-surface-100">
                    <Briefcase className="w-4 h-4 text-brand-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Ish ma'lumotlari</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Position */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                        Lavozimi *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <select
                          name="position"
                          value={formData.position}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-8 py-3 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors cursor-pointer"
                        >
                          {ROLES_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Salary */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                        Oylik maoshi (UZS)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <input
                          type="number"
                          name="salary"
                          value={formData.salary}
                          onChange={handleInputChange}
                          placeholder="3500000"
                          className="w-full pl-10 pr-3.5 py-3 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Hired Date */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                        Ishga qabul sanasi
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <input
                          type="date"
                          name="hired_date"
                          value={formData.hired_date}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3.5 py-3 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Hujjatlar va holat */}
                <div className="space-y-4 pt-6 border-t border-surface-100 dark:border-surface-800">
                  <div className="flex items-center gap-2 text-surface-800 dark:text-surface-100">
                    <FileText className="w-4 h-4 text-brand-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Hujjatlar</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Photo Upload */}
                    <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-700 p-4 bg-surface-50 dark:bg-surface-800/30 flex items-center gap-4">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-14 h-14 rounded-lg object-cover border border-surface-200 dark:border-surface-700"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-400 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-surface-900 dark:text-white">
                          Xodim rasmi
                        </p>
                        <label className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-surface-50 cursor-pointer shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{formData.photo ? 'Almashtirish' : 'Rasm yuklash'}</span>
                          <input
                            type="file"
                            name="photo"
                            accept="image/*"
                            onChange={handleInputChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Document Upload */}
                    <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-700 p-4 bg-surface-50 dark:bg-surface-800/30 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-surface-900 dark:text-white truncate">
                          {formData.file ? formData.file.name : 'Shartnoma / Hujjat'}
                        </p>
                        <label className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-surface-50 cursor-pointer shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{formData.file ? 'Almashtirish' : 'Fayl tanlash'}</span>
                          <input
                            type="file"
                            name="file"
                            onChange={handleInputChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-brand-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-surface-900 dark:text-white">
                          Faollik holati
                        </p>
                        <p className="text-xs text-surface-500">
                          Xodim hozirda ish faoliyatini olib bormoqdami
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-surface-200 peer-focus:outline-none rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-surface-600 peer-checked:bg-brand-600"></div>
                    </label>
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-surface-100 dark:border-surface-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saqlanmoqda...</span>
                      </>
                    ) : (
                      <span>{editStaff ? "O'zgarishlarni saqlash" : "Xodimni qo'shish"}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Staff;
