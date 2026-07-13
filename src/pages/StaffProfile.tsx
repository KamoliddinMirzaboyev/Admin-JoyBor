import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../components/UI/BackButton';
import Skeleton from '../components/UI/Skeleton';
import {
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Shield,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  MapPin,
  FileText,
  BadgeCheck,
  LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface StaffMember {
  id: number;
  name: string;
  role: string;
  phone: string;
  salary: string;
  status: string;
  avatar: string;
  email: string;
  joined_date: string;
  address: string;
  bio: string;
}

// Mock data (same as in Staff.tsx for consistency)
const MOCK_STAFF: StaffMember[] = [
  {
    id: 1,
    name: "Azamat Toshpo'latov",
    role: "Boshqaruvchi",
    phone: "+998 90 123 45 67",
    salary: "8,500,000",
    status: "Ishda",
    avatar: "https://i.pravatar.cc/150?u=1",
    email: "azamat@joybor.uz",
    joined_date: "2023-01-15",
    address: "Toshkent sh., Yunusobod tumani",
    bio: "Ko'p yillik tajribaga ega boshqaruvchi. Yotoqxona faoliyatini to'liq nazorat qiladi."
  },
  {
    id: 2,
    name: "Malika Ahmedova",
    role: "Administrator",
    phone: "+998 93 987 65 43",
    salary: "5,000,000",
    status: "Ishda",
    avatar: "https://i.pravatar.cc/150?u=2",
    email: "malika@joybor.uz",
    joined_date: "2023-03-20",
    address: "Toshkent sh., Chilonzor tumani",
    bio: "Talabalar bilan ishlash va hujjatlashtirish bo'yicha mas'ul xodim."
  },
  {
    id: 3,
    name: "Jasur Karimov",
    role: "Xavfsizlik xodimi",
    phone: "+998 94 555 44 33",
    salary: "4,200,000",
    status: "Ishda",
    avatar: "https://i.pravatar.cc/150?u=3",
    email: "jasur@joybor.uz",
    joined_date: "2022-11-05",
    address: "Toshkent vil., Zangiota tumani",
    bio: "Yotoqxona xavfsizligi va tartib-intizomiga javobgar."
  },
  {
    id: 4,
    name: "Nigora Usmonova",
    role: "Tozalik xodimi",
    phone: "+998 99 111 22 33",
    salary: "3,500,000",
    status: "Ta'tilda",
    avatar: "https://i.pravatar.cc/150?u=4",
    email: "nigora@joybor.uz",
    joined_date: "2023-06-12",
    address: "Toshkent sh., Olmazor tumani",
    bio: "Yotoqxona hududi va xonalari tozaligini ta'minlaydi."
  },
  {
    id: 5,
    name: "Sardor Ergashev",
    role: "Texnik xodim",
    phone: "+998 97 777 88 99",
    salary: "4,800,000",
    status: "Ishda",
    avatar: "https://i.pravatar.cc/150?u=5",
    email: "sardor@joybor.uz",
    joined_date: "2023-02-28",
    address: "Toshkent sh., Yashnobod tumani",
    bio: "Bino ichidagi barcha texnik nosozliklarni bartaraf etishga mas'ul."
  },
  {
    id: 6,
    name: "Dilnoza Olimova",
    role: "Oshpaz",
    phone: "+998 91 222 33 44",
    salary: "4,500,000",
    status: "Ishda",
    avatar: "https://i.pravatar.cc/150?u=6",
    email: "dilnoza@joybor.uz",
    joined_date: "2023-08-10",
    address: "Toshkent sh., Mirzo Ulug'bek tumani",
    bio: "Talabalar uchun mazali va sifatli taomlar tayyorlashga javobgar."
  }
];

function ReadOnlyInput({ label, value, icon: Icon }: { label: string; value?: string | number; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs text-surface-500 dark:text-surface-400 font-bold uppercase tracking-widest mb-1 ml-1">{label}</label>
      <div className="bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-white text-base font-semibold flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-brand-500" />}
        {value || '-'}
      </div>
    </div>
  );
}

const StaffProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const foundStaff = MOCK_STAFF.find(s => s.id === Number(id));
    if (foundStaff) {
      setStaff(foundStaff);
    } else {
      toast.error("Xodim topilmadi");
      navigate('/staff');
    }
  }, [id, navigate]);

  if (!staff) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const handleStatusToggle = () => {
    const newStatus = staff.status === 'Ishda' ? 'Ta\'tilda' : 'Ishda';
    setStaff({ ...staff, status: newStatus });
    toast.success(`Xodim holati "${newStatus}" ga o'zgartirildi`);
  };

  const handleDelete = () => {
    setDeleting(true);
    setTimeout(() => {
      toast.error("Xodim tizimdan o'chirildi");
      navigate('/staff');
      setDeleting(false);
      setShowDeleteModal(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-300 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <BackButton label="Orqaga" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-100 dark:border-brand-800/30">
              <BadgeCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h1 className="text-lg font-black text-surface-900 dark:text-white uppercase tracking-tight">Xodim Profili</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="px-6 py-3 rounded-xl bg-brand-600 text-white font-black hover:bg-brand-700 transition-colors duration-150 shadow-sm hover:shadow-md flex items-center gap-2 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              onClick={() => toast.info("Tez orada: Tahrirlash funksiyasi qo'shiladi")}
            >
              <Edit2 className="w-4 h-4" />
              <span>Tahrirlash</span>
            </button>
            <button
              className="px-6 py-3 rounded-xl bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 font-black hover:bg-danger-600 hover:text-white transition-colors duration-150 active:scale-[0.98] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4" />
              <span>O'chirish</span>
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden">

          {/* Hero Section */}
          <div className="relative h-32 bg-brand-600 dark:bg-brand-900">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <img
                  src={staff.avatar}
                  alt={staff.name}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white dark:border-surface-900 shadow-sm"
                />
                <div className={`absolute bottom-2 right-2 p-2.5 rounded-xl border-4 border-white dark:border-surface-900 shadow-sm ${
                  staff.status === 'Ishda' ? 'bg-success-500' : 'bg-warning-500'
                }`}>
                  {staff.status === 'Ishda' ? <CheckCircle className="w-4 h-4 text-white" /> : <Clock className="w-4 h-4 text-white" />}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-20 px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-surface-900 dark:text-white mb-1">{staff.name}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-brand-600 dark:text-brand-400 font-black uppercase tracking-widest text-sm">{staff.role}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-surface-300 dark:bg-surface-600"></div>
                  <span className="text-surface-500 dark:text-surface-400 font-bold text-sm">#ST-{staff.id.toString().padStart(4, '0')}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleStatusToggle}
                  className={`px-6 py-4 rounded-xl font-black transition-colors duration-150 active:scale-95 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
                    staff.status === 'Ishda'
                      ? 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400 hover:bg-warning-100'
                      : 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 hover:bg-success-100'
                  }`}
                >
                  {staff.status === 'Ishda' ? <Clock className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  <span>{staff.status === 'Ishda' ? "Ta'tilga chiqarish" : "Ishga qaytarish"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              <ReadOnlyInput label="Telefon" value={staff.phone} icon={Phone} />
              <ReadOnlyInput label="Email" value={staff.email} icon={Mail} />
              <ReadOnlyInput label="Maosh" value={`${staff.salary} UZS`} icon={DollarSign} />
              <ReadOnlyInput label="Manzil" value={staff.address} icon={MapPin} />
              <ReadOnlyInput label="Ishga kirgan sana" value={staff.joined_date} icon={Calendar} />
              <ReadOnlyInput label="Roli" value="Moderator" icon={Shield} />
            </div>

            <div className="mt-10 p-8 bg-brand-50/50 dark:bg-brand-900/10 rounded-2xl border border-brand-100/50 dark:border-brand-800/20">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h4 className="text-sm font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">Qisqacha tavsif</h4>
              </div>
              <p className="text-surface-700 dark:text-surface-300 leading-relaxed font-bold text-lg">
                {staff.bio}
              </p>
            </div>

            {/* Activity Timeline */}
            <div className="mt-12">
              <h3 className="text-xl font-black text-surface-900 dark:text-white mb-8 flex items-center gap-2">
                <Clock className="w-6 h-6 text-brand-500" />
                Oxirgi faoliyat
              </h3>
              <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-1 before:bg-surface-200 dark:before:bg-surface-700">
                <div className="relative pl-12">
                  <div className="absolute left-0 top-1 w-10 h-10 bg-success-500 rounded-xl border-4 border-white dark:border-surface-900 flex items-center justify-center shadow-sm">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-black text-surface-900 dark:text-white">Ishga keldi</p>
                    <p className="text-sm text-surface-500 font-bold">Bugun, 08:45</p>
                  </div>
                </div>
                <div className="relative pl-12">
                  <div className="absolute left-0 top-1 w-10 h-10 bg-brand-500 rounded-xl border-4 border-white dark:border-surface-900 flex items-center justify-center shadow-sm">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-black text-surface-900 dark:text-white">Tushlik tanaffusi</p>
                    <p className="text-sm text-surface-500 font-bold">Bugun, 13:00 - 14:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
              <h3 className="text-2xl font-black text-surface-900 dark:text-white mb-3">Xodimni o'chirish?</h3>
              <p className="text-surface-500 dark:text-surface-400 mb-8 font-bold">
                Siz haqiqatan ham <span className="text-surface-900 dark:text-white">{staff.name}</span>ni tizimdan butunlay o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 font-black hover:bg-surface-200 transition-colors duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-4 rounded-xl bg-danger-600 text-white font-black hover:bg-danger-700 shadow-sm transition-colors duration-150 active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
                >
                  {deleting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      <span>O'chirish</span>
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
