import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../components/UI/BackButton';
import Skeleton from '../components/UI/Skeleton';
import EmptyState from '../components/UI/EmptyState';
import {
  Phone,
  Calendar,
  DollarSign,
  Shield,
  Trash2,
  CheckCircle,
  Clock,
  FileText,
  BadgeCheck,
  LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../data/api';
import { mediaUrl } from '../data/config';

const ROLES_MAP: Record<string, string> = {
  manager: 'Boshqaruvchi',
  admin: 'Administrator',
  guard: 'Xavfsizlik xodimi',
  cleaner: 'Tozalik xodimi',
  technician: 'Texnik xodim',
  cook: 'Oshpaz',
};

interface StaffMember {
  id: number;
  name: string;
  last_name?: string;
  position: string;
  phone: string;
  salary: number | string;
  is_active: boolean;
  photo?: string | null;
  hired_date?: string;
  dormitory_name?: string;
}

interface AttendanceRow {
  id: number;
  date: string;
  status: string;
  note?: string;
}

function ReadOnlyInput({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | number;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs text-surface-500 dark:text-surface-400 font-bold uppercase tracking-widest mb-1 ml-1">
        {label}
      </label>
      <div className="bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-white text-base font-semibold flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-brand-500" />}
        {value || '-'}
      </div>
    </div>
  );
}

function formatSalary(salary: number | string): string {
  const n = typeof salary === 'number' ? salary : Number(String(salary).replace(/[^\d]/g, ''));
  if (!Number.isFinite(n)) return String(salary || '-');
  return `${new Intl.NumberFormat('uz-UZ').format(n)} UZS`;
}

const StaffProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const raw = (await api.getStaff({})) as
        | { results?: StaffMember[] }
        | StaffMember[];
      const list = Array.isArray(raw) ? raw : raw?.results || [];
      const found = list.find((s) => Number(s.id) === Number(id));
      if (!found) {
        toast.error("Xodim topilmadi");
        navigate('/staff');
        return;
      }
      setStaff(found);

      try {
        const att = (await api.getStaffAttendance({ staff: Number(id) })) as
          | { results?: AttendanceRow[] }
          | AttendanceRow[];
        setAttendance(Array.isArray(att) ? att : att?.results || []);
      } catch {
        setAttendance([]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Yuklash xatosi');
      navigate('/staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !staff) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const fullName = [staff.name, staff.last_name].filter(Boolean).join(' ');
  const roleLabel = ROLES_MAP[staff.position] || staff.position || '-';
  const statusLabel = staff.is_active ? 'Ishda' : "Ta'tilda";
  const avatar = mediaUrl(staff.photo) || undefined;

  const handleStatusToggle = async () => {
    setToggling(true);
    try {
      const form = new FormData();
      form.append('is_active', String(!staff.is_active));
      await api.updateStaff(staff.id, form);
      setStaff({ ...staff, is_active: !staff.is_active });
      toast.success(
        !staff.is_active
          ? "Xodim ishga qaytarildi"
          : "Xodim ta'tilga chiqarildi"
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Holatni yangilab bo‘lmadi');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteStaff(staff.id);
      toast.success("Xodim o'chirildi");
      navigate('/staff');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "O'chirishda xatolik");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-300 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <BackButton label="Orqaga" />
          <div className="flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-100 dark:border-brand-800/30">
            <BadgeCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h1 className="text-lg font-black text-surface-900 dark:text-white uppercase tracking-tight">
              Xodim Profili
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              className="px-6 py-3 rounded-xl bg-brand-600 text-white font-black hover:bg-brand-700 transition-colors duration-150 shadow-sm flex items-center gap-2"
              onClick={() => navigate('/staff')}
            >
              Ro‘yxatga qaytish
            </button>
            <button
              className="px-6 py-3 rounded-xl bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 font-black hover:bg-danger-600 hover:text-white transition-colors duration-150 flex items-center gap-2"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4" />
              O‘chirish
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden">
          <div className="relative h-32 bg-brand-600 dark:bg-brand-900">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={fullName}
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-white dark:border-surface-900 shadow-sm"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl border-4 border-white dark:border-surface-900 shadow-sm bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-3xl font-black text-brand-700">
                    {(staff.name || '?')[0]?.toUpperCase()}
                  </div>
                )}
                <div
                  className={`absolute bottom-2 right-2 p-2.5 rounded-xl border-4 border-white dark:border-surface-900 shadow-sm ${
                    staff.is_active ? 'bg-success-500' : 'bg-warning-500'
                  }`}
                >
                  {staff.is_active ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : (
                    <Clock className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-20 px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-surface-900 dark:text-white mb-1">
                  {fullName}
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-brand-600 dark:text-brand-400 font-black uppercase tracking-widest text-sm">
                    {roleLabel}
                  </span>
                  <span className="text-surface-500 dark:text-surface-400 font-bold text-sm">
                    #{staff.id}
                  </span>
                  <span className="text-sm font-bold text-surface-600 dark:text-surface-300">
                    {statusLabel}
                  </span>
                </div>
              </div>

              <button
                onClick={handleStatusToggle}
                disabled={toggling}
                className={`px-6 py-4 rounded-xl font-black transition-colors duration-150 flex items-center gap-2 disabled:opacity-50 ${
                  staff.is_active
                    ? 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400 hover:bg-warning-100'
                    : 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 hover:bg-success-100'
                }`}
              >
                {staff.is_active ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                <span>
                  {staff.is_active ? "Ta'tilga chiqarish" : 'Ishga qaytarish'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              <ReadOnlyInput label="Telefon" value={staff.phone} icon={Phone} />
              <ReadOnlyInput label="Maosh" value={formatSalary(staff.salary)} icon={DollarSign} />
              <ReadOnlyInput
                label="Ishga kirgan sana"
                value={staff.hired_date || '-'}
                icon={Calendar}
              />
              <ReadOnlyInput label="Lavozim" value={roleLabel} icon={Shield} />
              <ReadOnlyInput
                label="Yotoqxona"
                value={staff.dormitory_name || '-'}
                icon={FileText}
              />
            </div>

            <div className="mt-12">
              <h3 className="text-xl font-black text-surface-900 dark:text-white mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-brand-500" />
                Davomat yozuvlari
              </h3>
              {attendance.length === 0 ? (
                <EmptyState
                  title="Davomat yo‘q"
                  description="Bu xodim uchun staff-attendance yozuvlari topilmadi"
                />
              ) : (
                <div className="space-y-3">
                  {attendance.slice(0, 20).map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/40"
                    >
                      <div>
                        <p className="font-bold text-surface-900 dark:text-white">{row.date}</p>
                        {row.note && (
                          <p className="text-sm text-surface-500">{row.note}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-brand-600">{row.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-surface-900/60 dark:bg-surface-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-surface-900 w-full max-w-md rounded-2xl shadow-sm p-8 border border-surface-200 dark:border-surface-800 text-center"
            >
              <div className="w-20 h-20 bg-danger-50 dark:bg-danger-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-danger-500">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-surface-900 dark:text-white mb-3">
                Xodimni o‘chirish?
              </h3>
              <p className="text-surface-500 dark:text-surface-400 mb-8 font-bold">
                <span className="text-surface-900 dark:text-white">{fullName}</span> ni tizimdan
                o‘chirasizmi?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 font-black"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-4 rounded-xl bg-danger-600 text-white font-black disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      O‘chirish
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffProfile;
