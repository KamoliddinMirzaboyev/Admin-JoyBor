import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Edit2,
  Trash2,
  X,
  Search,
  Filter,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/UI/DataTable';
import EmptyState from '../components/UI/EmptyState';
import Skeleton from '../components/UI/Skeleton';
import api from '../data/api';

const ROLES_MAP: Record<string, string> = {
  "manager": "Boshqaruvchi",
  "admin": "Administrator",
  "guard": "Xavfsizlik xodimi",
  "cleaner": "Tozalik xodimi",
  "technician": "Texnik xodim",
  "cook": "Oshpaz"
};

const ROLES_OPTIONS = [
  { value: "manager", label: "Boshqaruvchi" },
  { value: "admin", label: "Administrator" },
  { value: "guard", label: "Xavfsizlik xodimi" },
  { value: "cleaner", label: "Tozalik xodimi" },
  { value: "technician", label: "Texnik xodim" },
  { value: "cook", label: "Oshpaz" }
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
  phone: '',
  salary: '',
  hired_date: new Date().toISOString().split('T')[0],
  is_active: true,
  photo: null,
  file: null,
};

const Staff: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<StaffFormData>(emptyForm);

  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  // Fetch staff list
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff', search, positionFilter],
    queryFn: () => api.getStaff({ search, position: positionFilter })
  });

  const staffList: StaffMember[] = Array.isArray((staffData as { results?: StaffMember[] })?.results)
    ? (staffData as { results: StaffMember[] }).results
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).files?.[0] ?? null }));
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
      form.append('phone', data.phone);
      form.append('salary', data.salary.toString().replace(/[^0-9]/g, ''));
      form.append('hired_date', data.hired_date);
      form.append('is_active', data.is_active.toString());

      if (data.photo instanceof File) form.append('photo', data.photo);
      if (data.file instanceof File) form.append('file', data.file);

      if (editStaff) {
        return api.updateStaff(editStaff.id, form);
      }
      return api.createStaff(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsModalOpen(false);
      setEditStaff(null);
      setFormData(emptyForm);
      toast.success(editStaff ? "Xodim ma'lumotlari yangilandi" : "Yangi xodim muvaffaqiyatli qo'shildi");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Xatolik yuz berdi");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.error("Xodim tizimdan o'chirildi");
    },
    onError: (error: Error) => {
      toast.error(error.message || "O'chirishda xatolik");
    }
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Haqiqatan ham ushbu xodimni o'chirmoqchimisiz?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (staff: StaffMember) => {
    setEditStaff(staff);
    setFormData({
      name: staff.name,
      last_name: staff.last_name || '',
      position: staff.position,
      phone: staff.phone,
      salary: staff.salary.toString(),
      hired_date: staff.hired_date || new Date().toISOString().split('T')[0],
      is_active: staff.is_active,
      photo: null,
      file: null,
    });
    setIsModalOpen(true);
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
              className="w-10 h-10 rounded-lg object-cover border border-surface-200 dark:border-surface-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-800">
              {String(row.name)[0]}{String(row.last_name ?? '')[0] ?? ''}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-surface-900 dark:text-white text-sm sm:text-base">{String(row.name)} {String(row.last_name ?? '')}</span>
            <span className="text-xs text-surface-500 dark:text-surface-400">{String(row.phone)}</span>
          </div>
        </div>
      )
    },
    {
      key: 'position',
      title: 'Lavozim',
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 px-3 py-1 rounded-lg">
          {ROLES_MAP[String(value)] || String(value)}
        </span>
      )
    },
    {
      key: 'salary',
      title: 'Maosh',
      sortable: true,
      render: (value: unknown) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-surface-900 dark:text-white">
            {Number(value).toLocaleString()}
          </span>
          <span className="text-[10px] text-surface-400 font-bold uppercase">UZS</span>
        </div>
      )
    },
    {
      key: 'is_active',
      title: 'Holati',
      sortable: true,
      render: (value: unknown) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
          value
            ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
            : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${value ? 'bg-success-500' : 'bg-warning-500'}`}></span>
          {value ? 'Ishda' : 'Nofaol'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Amallar',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row as unknown as StaffMember);
            }}
            className="p-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors duration-150"
            title="Tahrirlash"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(Number(row.id));
            }}
            className="p-2 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded-lg transition-colors duration-150"
            title="O'chirish"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-surface-50 dark:bg-surface-950 transition-colors duration-300">

      {/* Header Section - Fixed */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-surface-900 dark:text-white tracking-tight">
                Xodimlar
              </h1>
              <p className="text-surface-500 dark:text-surface-400 font-medium">
                Tizimdagi barcha xodimlarni boshqarish va monitoring qilish
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  placeholder="Qidirish..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/40 outline-none transition-colors duration-150 w-full sm:w-64"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/40 outline-none transition-colors duration-150 appearance-none"
                >
                  <option value="">Barcha lavozimlar</option>
                  {ROLES_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditStaff(null);
              setFormData(emptyForm);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-sm hover:shadow-md transition-colors duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <UserPlus className="w-5 h-5" />
            <span>Xodim qo'shish</span>
          </motion.button>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-hidden px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-8">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
            <EmptyState
              icon={Users}
              title="Xodimlar topilmadi"
              description="Filtrlarni o'zgartirib ko'ring yoki yangi xodim qo'shing."
            />
          </div>
        ) : (
          <DataTable
            data={staffList as unknown as Record<string, unknown>[]}
            columns={columns}
          />
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-surface-900/60 dark:bg-surface-950/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white dark:bg-surface-900 w-full max-w-2xl rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6 border-b border-surface-200 dark:border-surface-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-50 dark:bg-brand-900/30 rounded-lg text-brand-600 dark:text-brand-400">
                      {editStaff ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-surface-900 dark:text-white">
                        {editStaff ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors duration-150 text-surface-400 hover:text-danger-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5 ml-1">
                          Ismi *
                        </label>
                        <input
                          required
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Ism"
                          className="w-full px-4 py-2.5 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:ring-2 focus:ring-brand-500/40 outline-none transition-colors duration-150 text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5 ml-1">
                          Familiyasi
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          placeholder="Familiya"
                          className="w-full px-4 py-2.5 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:ring-2 focus:ring-brand-500/40 outline-none transition-colors duration-150 text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5 ml-1">
                          Lavozimi
                        </label>
                        <select
                          name="position"
                          value={formData.position}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 outline-none transition-colors duration-150 text-sm font-medium"
                        >
                          {ROLES_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5 ml-1">
                          Telefon raqami
                        </label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+998"
                          className="w-full px-4 py-2.5 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:ring-2 focus:ring-brand-500/40 outline-none transition-colors duration-150 text-sm font-medium"
                        />
                      </div>
                    </div>

                    {/* Additional Info & Files */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5 ml-1">
                          Maoshi (UZS)
                        </label>
                        <input
                          type="number"
                          name="salary"
                          value={formData.salary}
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full px-4 py-2.5 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:ring-2 focus:ring-brand-500/40 outline-none transition-colors duration-150 text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5 ml-1">
                          Ishga kirgan sanasi
                        </label>
                        <input
                          type="date"
                          name="hired_date"
                          value={formData.hired_date}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 outline-none transition-colors duration-150 text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5 ml-1">
                          Rasmi (Photo)
                        </label>
                        <input
                          type="file"
                          name="photo"
                          onChange={handleInputChange}
                          accept="image/*"
                          className="w-full text-sm text-surface-500 dark:text-surface-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 dark:file:bg-brand-900/30 dark:file:text-brand-400 hover:file:bg-brand-100 transition-colors duration-150 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5 ml-1">
                          Hujjat (File)
                        </label>
                        <input
                          type="file"
                          name="file"
                          onChange={handleInputChange}
                          className="w-full text-sm text-surface-500 dark:text-surface-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 dark:file:bg-brand-900/30 dark:file:text-brand-400 hover:file:bg-brand-100 transition-colors duration-150 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-brand-600 border-surface-300 rounded focus:ring-brand-500/40 transition-colors duration-150"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      Hozirda faol (Ishda)
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-surface-200 dark:border-surface-800">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-2.5 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-xl font-bold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150 active:scale-[0.98] text-sm"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-sm transition-colors duration-150 active:scale-[0.98] text-sm disabled:opacity-50"
                    >
                      {saveMutation.isPending ? "Saqlanmoqda..." : (editStaff ? "Yangilash" : "Xodimni saqlash")}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Staff;
