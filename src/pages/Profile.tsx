import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  User,
  KeyRound,
  Phone,
  UserCog,
  MessageCircle,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  Camera,
  X,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import { get, patch } from '../data/api';
import Skeleton from '../components/UI/Skeleton';

interface AdminProfile {
  id?: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  image?: string | null;
  bio?: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  telegram?: string;
  role?: string;
}

const Profile: React.FC = () => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password modal state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    image: null as File | null,
    bio: '',
    phone: '',
    birth_date: '',
    address: '',
    telegram: '',
  });

  // Fetch admin profile
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await get('/me/');
        setAdmin(data as AdminProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Profil ma'lumotlarini yuklashda xatolik");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (admin) {
      setEditForm({
        email: admin.email || '',
        first_name: admin.first_name || '',
        last_name: admin.last_name || '',
        image: null,
        bio: admin.bio || '',
        phone: admin.phone || '',
        birth_date: admin.birth_date || '',
        address: admin.address || '',
        telegram: admin.telegram || '',
      });
      setPhotoPreview(admin.image || null);
    }
  }, [admin, showEditModal]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) {
      setEditForm((f) => ({ ...f, image: files[0] }));
      setPhotoPreview(URL.createObjectURL(files[0]));
    } else {
      setEditForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    setIsUpdating(true);

    try {
      const updateData: Record<string, string> = {};
      if (editForm.email !== admin.email) updateData.email = editForm.email;
      if (editForm.first_name !== admin.first_name) updateData.first_name = editForm.first_name;
      if (editForm.last_name !== admin.last_name) updateData.last_name = editForm.last_name;
      if (editForm.bio !== admin.bio) updateData.bio = editForm.bio;
      if (editForm.phone !== admin.phone) updateData.phone = editForm.phone;
      if (editForm.birth_date !== admin.birth_date) updateData.birth_date = editForm.birth_date;
      if (editForm.address !== admin.address) updateData.address = editForm.address;
      if (editForm.telegram !== admin.telegram) updateData.telegram = editForm.telegram;

      let updatedData: AdminProfile;
      if (editForm.image) {
        const formData = new FormData();
        Object.entries(updateData).forEach(([key, value]) => {
          if (value) formData.append(key, value);
        });
        formData.append('image', editForm.image);
        updatedData = (await patch('/me/', formData)) as AdminProfile;
      } else {
        updatedData = (await patch('/me/', updateData)) as AdminProfile;
      }

      setAdmin(updatedData);
      setShowEditModal(false);
      toast.success('Profil ma\'lumotlari muvaffaqiyatli yangilandi!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Profilni yangilashda xatolik';
      toast.error('Xatolik: ' + message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Yangi parollar mos kelmadi');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setPasswordError('');
    setIsChangingPass(true);

    try {
      await patch('/me/', {
        old_password: oldPassword,
        password: newPassword,
        new_password: newPassword,
      });
      toast.success("Parol muvaffaqiyatli o'zgartirildi!");
      setShowPasswordForm(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Parolni o'zgartirishda xatolik yuz berdi.";
      setPasswordError(message);
      toast.error(message);
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Haqiqatan ham tizimdan chiqmoqchimisiz?")) {
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-danger-50 text-danger-600 flex items-center justify-center mx-auto">
          <X className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-surface-900 dark:text-white">
          Profilni yuklab bo'lmadi
        </h3>
        <p className="text-sm text-surface-500">{error || "Kutilmagan xatolik yuz berdi"}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  const fullName = [admin.first_name, admin.last_name].filter(Boolean).join(' ') || admin.username || 'Administrator';
  const initials = (admin.first_name?.[0] || admin.username?.[0] || 'A').toUpperCase() + (admin.last_name?.[0] || '').toUpperCase();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Executive Profile Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden"
        >
          {/* Top Banner Gradient */}
          <div className="h-32 sm:h-40 bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>

          <div className="px-6 sm:px-8 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
              {/* Avatar + Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left w-full sm:w-auto">
                <div className="relative">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-brand-600 flex items-center justify-center text-white font-extrabold text-3xl shadow-lg border-4 border-white dark:border-surface-900 overflow-hidden">
                    {admin.image ? (
                      <img src={admin.image} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 w-5 h-5 bg-success-500 rounded-full border-2 border-white dark:border-surface-900 shadow-sm flex items-center justify-center" title="Faol holatda">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>

                <div className="space-y-1 mt-2 sm:mt-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 dark:text-white tracking-tight">
                      {fullName}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                      Bosh Administrator
                    </span>
                  </div>
                  <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                    @{admin.username || 'admin'}
                  </p>
                  {admin.bio && (
                    <p className="text-xs text-surface-600 dark:text-surface-300 max-w-xl line-clamp-2">
                      {admin.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 w-full sm:w-auto pt-2 sm:pt-0">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all duration-150 active:scale-95"
                >
                  <UserCog className="w-4 h-4" />
                  <span>Tahrirlash</span>
                </button>
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Parol</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/40 border border-danger-200 dark:border-danger-900/60 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Chiqish</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2-Column Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Personal and Contact Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* Shaxsiy Ma'lumotlar Card */}
            <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-7 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center border border-brand-200/60 dark:border-brand-800/60">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-surface-900 dark:text-white">
                      Shaxsiy ma'lumotlar
                    </h2>
                    <p className="text-xs text-surface-500">
                      Asosiy identifikatsiya va shaxsiy ma'lumotlar
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  O'zgartirish
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/60 dark:border-surface-700/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Ism
                  </span>
                  <p className="text-sm font-bold text-surface-900 dark:text-white mt-1">
                    {admin.first_name || '-'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/60 dark:border-surface-700/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Familiya
                  </span>
                  <p className="text-sm font-bold text-surface-900 dark:text-white mt-1">
                    {admin.last_name || '-'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/60 dark:border-surface-700/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Foydalanuvchi nomi
                  </span>
                  <p className="text-sm font-bold text-surface-900 dark:text-white mt-1">
                    @{admin.username || '-'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/60 dark:border-surface-700/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Tug'ilgan sana
                  </span>
                  <p className="text-sm font-bold text-surface-900 dark:text-white mt-1">
                    {admin.birth_date || '-'}
                  </p>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/60 dark:border-surface-700/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Manzil
                  </span>
                  <p className="text-sm font-bold text-surface-900 dark:text-white mt-1">
                    {admin.address || 'Manzil kiritilmagan'}
                  </p>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/60 dark:border-surface-700/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Bio / Ma'lumot
                  </span>
                  <p className="text-sm text-surface-700 dark:text-surface-300 mt-1 leading-relaxed">
                    {admin.bio || 'Qisqacha ma\'lumot kiritilmagan'}
                  </p>
                </div>
              </div>
            </div>

            {/* Aloqa Ma'lumotlari Card */}
            <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-7 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-info-50 dark:bg-info-950/60 text-info-600 flex items-center justify-center border border-info-200/60 dark:border-info-800/60">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-surface-900 dark:text-white">
                      Aloqa va Xabarnomalar
                    </h2>
                    <p className="text-xs text-surface-500">
                      Tizim bilan aloqa o'rnatish kanallari
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/60 dark:border-surface-700/60 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-surface-500 uppercase">Email</span>
                    <p className="text-xs sm:text-sm font-bold text-surface-900 dark:text-white truncate mt-0.5">
                      {admin.email || '-'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/60 dark:border-surface-700/60 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-success-50 dark:bg-success-900/40 text-success-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-surface-500 uppercase">Telefon</span>
                    <p className="text-xs sm:text-sm font-bold text-surface-900 dark:text-white truncate mt-0.5">
                      {admin.phone || '-'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/60 dark:border-surface-700/60 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-info-50 dark:bg-info-900/40 text-info-600 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-surface-500 uppercase">Telegram</span>
                    <p className="text-xs sm:text-sm font-bold text-surface-900 dark:text-white truncate mt-0.5">
                      {admin.telegram ? (admin.telegram.startsWith('@') ? admin.telegram : `@${admin.telegram}`) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Security & Role Cards */}
          <div className="lg:col-span-4 space-y-6">
            {/* Account & Security Card */}
            <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-surface-100 dark:border-surface-800 pb-3.5">
                <div className="w-8 h-8 rounded-xl bg-success-50 dark:bg-success-950/60 text-success-600 flex items-center justify-center border border-success-200/60 dark:border-success-800/60">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-surface-900 dark:text-white text-base">
                  Xavfsizlik holati
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/40">
                  <span className="text-surface-600 dark:text-surface-400">Hisob turi</span>
                  <span className="font-bold text-surface-900 dark:text-white">Admin (JoyBor)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/40">
                  <span className="text-surface-600 dark:text-surface-400">Autentifikatsiya</span>
                  <span className="font-bold text-success-600">Faol sessiya</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/40">
                  <span className="text-surface-600 dark:text-surface-400">Parol himoyasi</span>
                  <span className="font-bold text-brand-600">O'rnatilgan</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordForm(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-200 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Parolni yangilash</span>
              </button>
            </div>

            {/* Quick Admin Permissions Card */}
            <div className="bg-gradient-to-br from-brand-900 to-surface-900 text-white rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-brand-300">
                <Briefcase className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Admin Huquqlari
                </h4>
              </div>

              <div className="space-y-2 text-xs text-surface-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-400 flex-shrink-0" />
                  <span>Xodimlarni boshqarish va ro'yxatga olish</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-400 flex-shrink-0" />
                  <span>Arizalar va to'lovlar monitoringi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-400 flex-shrink-0" />
                  <span>Xonalar va o'rinlar taqsimoti</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 bg-surface-950/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white dark:bg-surface-900 w-full max-w-2xl rounded-3xl shadow-xl border border-surface-200 dark:border-surface-800 overflow-hidden my-8 z-10"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center border border-brand-200/60 dark:border-brand-800/60">
                    <UserCog className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                      Profil ma'lumotlarini tahrirlash
                    </h3>
                    <p className="text-xs text-surface-500">
                      O'zgarishlarni kiritib saqlang
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleEditSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Photo Upload */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700">
                  <div className="relative w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-xl overflow-hidden flex-shrink-0 shadow-sm">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-surface-900 dark:text-white">
                      Profil rasmini yangilash
                    </p>
                    <label className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-surface-50 cursor-pointer shadow-sm">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Rasm tanlash</span>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleEditChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                      Ism
                    </label>
                    <input
                      name="first_name"
                      value={editForm.first_name}
                      onChange={handleEditChange}
                      placeholder="Ism"
                      className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                      Familiya
                    </label>
                    <input
                      name="last_name"
                      value={editForm.last_name}
                      onChange={handleEditChange}
                      placeholder="Familiya"
                      className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      placeholder="admin@joybor.uz"
                      className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                      Telefon
                    </label>
                    <input
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      placeholder="+998 90 123 45 67"
                      className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                      Telegram
                    </label>
                    <input
                      name="telegram"
                      value={editForm.telegram}
                      onChange={handleEditChange}
                      placeholder="@username"
                      className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                      Tug'ilgan sana
                    </label>
                    <input
                      name="birth_date"
                      type="date"
                      value={editForm.birth_date}
                      onChange={handleEditChange}
                      className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                      Manzil
                    </label>
                    <input
                      name="address"
                      value={editForm.address}
                      onChange={handleEditChange}
                      placeholder="Toshkent shahar, Yunusobod..."
                      className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                      Bio / Qisqacha ma'lumot
                    </label>
                    <textarea
                      rows={3}
                      name="bio"
                      value={editForm.bio}
                      onChange={handleEditChange}
                      placeholder="O'zingiz haqingizda qisqacha..."
                      className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-sm font-semibold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-all duration-150 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saqlanmoqda...</span>
                      </>
                    ) : (
                      <span>O'zgarishlarni saqlash</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordForm(false)}
              className="fixed inset-0 bg-surface-950/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white dark:bg-surface-900 w-full max-w-md rounded-3xl shadow-xl border border-surface-200 dark:border-surface-800 overflow-hidden z-10 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center border border-brand-200/60 dark:border-brand-800/60">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-surface-900 dark:text-white">
                      Parolni o'zgartirish
                    </h3>
                    <p className="text-xs text-surface-500">
                      Yangi xavfsiz parol kiriting
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordForm(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {passwordError && (
                <div className="p-3 rounded-xl bg-danger-50 text-danger-700 text-xs">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                    Joriy parol
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPass ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                    >
                      {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                    Yangi parol
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Kamida 6 ta belgi"
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                    Yangi parolni tasdiqlang
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Parolni qayta kiriting"
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-xs font-semibold hover:bg-surface-200"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isChangingPass ? 'Saqlanmoqda...' : 'Parolni saqlash'}
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

export default Profile;
