import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { LogOut, User, KeyRound, Phone, UserCog, CalendarCheck2, MapPin, MessageCircle } from 'lucide-react';
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
}

function ProfileField({ icon, label, value, actionLabel, onAction }: { icon: React.ReactNode; label: string; value?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-surface-100 dark:border-surface-800 pb-3 last:border-b-0 last:pb-0">
      <span className="text-surface-900 dark:text-surface-200">{icon}</span>
      <span className="font-medium text-surface-700 dark:text-surface-300 w-32">{label}:</span>
      <span className="flex-1 text-surface-900 dark:text-white">{value || '-'}</span>
      {actionLabel && onAction && (
        <button
          className="ml-2 px-3 py-1 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-900 dark:text-white text-xs hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors duration-150"
          onClick={onAction}
        >{actionLabel}</button>
      )}
    </div>
  );
}

const Profile: React.FC = () => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin profilni yuklash
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await get('/me/');
        setAdmin(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Profil ma\'lumotlarini yuklashda xatolik');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
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
    }
  }, [admin, showEditModal]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const files = (e.target as HTMLInputElement).files;
    setEditForm(f => ({
      ...f,
      [name]: files ? files[0] : value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    setIsUpdating(true);

    try {
      // Faqat o'zgargan maydonlarni yuborish
      const updateData: Record<string, string> = {};

      if (editForm.email && editForm.email !== admin.email) updateData.email = editForm.email;
      if (editForm.first_name && editForm.first_name !== admin.first_name) updateData.first_name = editForm.first_name;
      if (editForm.last_name && editForm.last_name !== admin.last_name) updateData.last_name = editForm.last_name;
      if (editForm.bio && editForm.bio !== admin.bio) updateData.bio = editForm.bio;
      if (editForm.phone && editForm.phone !== admin.phone) updateData.phone = editForm.phone;
      if (editForm.birth_date && editForm.birth_date !== admin.birth_date) updateData.birth_date = editForm.birth_date;
      if (editForm.address && editForm.address !== admin.address) updateData.address = editForm.address;
      if (editForm.telegram && editForm.telegram !== admin.telegram) updateData.telegram = editForm.telegram;

      let updatedData: AdminProfile;
      if (editForm.image) {
        // Agar rasm o'zgargan bo'lsa, FormData ishlatish kerak
        const formData = new FormData();
        Object.entries(updateData).forEach(([key, value]) => {
          if (value) formData.append(key, value);
        });
        formData.append('image', editForm.image);
        updatedData = await patch('/me/', formData);
        setAdmin(updatedData);
      } else if (Object.keys(updateData).length > 0) {
        // Oddiy JSON update - faqat o'zgargan maydonlar bo'lsa
        updatedData = await patch('/me/', updateData);
        setAdmin(updatedData);
      }

      setShowEditModal(false);
      toast.success('Profil muvaffaqiyatli yangilandi!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Profilni yangilashda xatolik';
      toast.error('Xatolik: ' + message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }
  if (error || !admin) return <div className="text-center py-10 text-danger-600 dark:text-danger-400">Admin ma'lumotlarini yuklashda xatolik yuz berdi.</div>;

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Parollar mos emas');
      return;
    }
    setPasswordError('');
    setPasswordSuccess(true);
    toast.success('Parol muvaffaqiyatli o\'zgartirildi!');
    setTimeout(() => setPasswordSuccess(false), 2000);
    setShowPasswordForm(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="p-4 sm:p-6 max-w-5xl mx-auto w-full"
    >
      <div className="w-full rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative flex flex-col items-center justify-center pt-10 pb-6 px-8 border-b border-surface-100 dark:border-surface-800 bg-brand-50 dark:bg-surface-900">
          <div className="relative w-32 h-32 mb-4">
            <div className="w-full h-full rounded-full bg-brand-600 flex items-center justify-center shadow-sm border-4 border-white dark:border-surface-800 overflow-hidden">
              {admin.image ? (
                <img src={admin.image} alt="Admin Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-4xl">
                  {(() => {
                    // Ism va familiya bosh harflarini olish
                    if (admin.first_name && admin.last_name) {
                      return admin.first_name[0]?.toUpperCase() + admin.last_name[0]?.toUpperCase();
                    }
                    if (admin.first_name) {
                      return admin.first_name[0]?.toUpperCase();
                    }
                    if (admin.bio) {
                      const names = admin.bio.trim().split(' ');
                      if (names.length >= 2) {
                        return names[0][0]?.toUpperCase() + names[1][0]?.toUpperCase();
                      }
                      return names[0][0]?.toUpperCase() || 'A';
                    }
                    return admin.username?.[0]?.toUpperCase() || 'A';
                  })()}
                </span>
              )}
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-success-500 rounded-full border-2 border-white dark:border-surface-800 shadow-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-success-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-surface-900 dark:text-white mb-1 text-center">
            {(() => {
              // Ism va familiyani ko'rsatish
              if (admin.first_name && admin.last_name) {
                return `${admin.first_name} ${admin.last_name}`;
              }
              if (admin.first_name) {
                return admin.first_name;
              }
              if (admin.bio) {
                return admin.bio;
              }
              return admin.username || 'Admin';
            })()}
          </h2>
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">@{admin.username}</p>
          <p className="text-sm sm:text-base text-surface-500 dark:text-surface-300 mb-2">{admin.bio || 'Bio kiritilmagan'}</p>
        </div>
        {/* Main content */}
        <div className="px-2 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col gap-6 border border-surface-200 dark:border-surface-800 w-full max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <ProfileField icon={<User className="w-5 h-5" />} label="Ism" value={admin.first_name} />
              <ProfileField icon={<User className="w-5 h-5" />} label="Familiya" value={admin.last_name} />
              <ProfileField icon={<Phone className="w-5 h-5" />} label="Telefon" value={admin.phone} />
              <ProfileField icon={<CalendarCheck2 className="w-5 h-5" />} label="Tug'ilgan sana" value={admin.birth_date} />
              <ProfileField icon={<MessageCircle className="w-5 h-5" />} label="Telegram" value={admin.telegram} />
              <ProfileField icon={<MapPin className="w-5 h-5" />} label="Manzil" value={admin.address} />
            </div>
            <button
              className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors duration-150 flex items-center justify-center gap-2 shadow-sm text-sm sm:text-base"
              onClick={() => setShowEditModal(true)}
            >
              <UserCog className="w-5 h-5" /> Profilni tahrirlash
            </button>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
              <button
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-surface-800 dark:bg-surface-700 text-white font-semibold hover:bg-surface-900 dark:hover:bg-surface-600 transition-colors duration-150 flex items-center justify-center gap-2 shadow-sm text-sm sm:text-base"
                onClick={() => setShowPasswordForm(true)}
              >
                <KeyRound className="w-5 h-5" /> Parolni o'zgartirish
              </button>
              <button
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-900 dark:text-white font-semibold hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors duration-150 flex items-center justify-center gap-2 shadow-sm text-sm sm:text-base"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" /> Chiqish
              </button>
            </div>
          </div>
        </div>
        {/* Parol o'zgartirish modal */}
        {showPasswordForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowPasswordForm(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-8 w-full max-w-xs flex flex-col gap-4 border border-surface-200 dark:border-surface-700"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2 text-surface-900 dark:text-white">Parolni o'zgartirish</h3>
              <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                <input
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-colors duration-150"
                  placeholder="Joriy parol"
                  required
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-colors duration-150"
                  placeholder="Yangi parol"
                  required
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-colors duration-150"
                  placeholder="Yangi parolni tasdiqlang"
                  required
                />
                {passwordError && <div className="text-danger-600 dark:text-danger-400 text-sm text-center">{passwordError}</div>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 px-4 py-2 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-900 dark:text-white hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors duration-150"
                    onClick={() => setShowPasswordForm(false)}
                  >Bekor qilish</button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-xl bg-surface-800 dark:bg-surface-700 text-white font-semibold hover:bg-surface-900 dark:hover:bg-surface-600 transition-colors duration-150"
                  >Saqlash</button>
                </div>
                {passwordSuccess && <div className="text-success-600 dark:text-success-400 text-sm text-center">Parol muvaffaqiyatli o'zgartirildi!</div>}
              </form>
            </motion.div>
          </div>
        )}
        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 w-full max-w-4xl p-0 overflow-hidden relative max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 pt-6 pb-2 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between sticky top-0 bg-white dark:bg-surface-900 z-10">
                <div className="flex-1 flex items-center justify-center relative">
                  <h2 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-white text-center w-full">Profilni tahrirlash</h2>
                  <button onClick={() => setShowEditModal(false)} className="absolute right-0 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 p-1 rounded-xl transition-colors duration-150">
                    <span className="text-2xl">×</span>
                  </button>
                </div>
              </div>
              <form id="editProfileForm" onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto px-2 sm:px-8 py-6 sm:py-8 pb-6 space-y-6 sm:space-y-8">
                {/* Profile Image Upload */}
                <div className="flex flex-col items-center gap-3 mb-4">
                  <label className="block text-sm sm:text-base font-semibold text-surface-800 dark:text-surface-200 mb-2">Profil rasmi</label>
                  <div className="relative w-24 h-24 group">
                    {editForm.image || admin.image ? (
                      <img
                        src={editForm.image ? URL.createObjectURL(editForm.image) : admin.image ?? undefined}
                        alt="Profil"
                        className="w-24 h-24 rounded-xl object-cover border-2 border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 shadow-sm transition-colors duration-150"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl flex items-center justify-center text-3xl font-bold text-white bg-brand-600 shadow-sm select-none">
                        {admin.username?.[0] || 'A'}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      name="image"
                      ref={fileInputRef}
                      onChange={handleEditChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-20"
                      title="Rasm yuklash"
                      aria-label="Profil rasm yuklash"
                    />
                    {/* Overlay for hover */}
                    <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                      <span className="text-white">📸</span>
                    </div>
                    {/* Remove button */}
                    {(editForm.image || admin.image) && (
                      <button
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, image: null }))}
                        className="absolute -top-2 -right-2 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-full p-1 shadow-sm hover:bg-danger-500 hover:text-white transition-colors duration-150 z-30"
                        aria-label="Rasmni olib tashlash"
                      >
                        <span className="text-2xl">×</span>
                      </button>
                    )}
                  </div>
                </div>
                {/* Personal Info Section */}
                <div>
                  <div className="text-xs sm:text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">Shaxsiy ma'lumotlar</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Ism</label>
                      <input name="first_name" value={editForm.first_name} onChange={handleEditChange} className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent transition-colors duration-150" placeholder="Ism" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Familiya</label>
                      <input name="last_name" value={editForm.last_name} onChange={handleEditChange} className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent transition-colors duration-150" placeholder="Familiya" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Email</label>
                      <input name="email" type="email" value={editForm.email} onChange={handleEditChange} className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent transition-colors duration-150" placeholder="Email" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Telegram</label>
                      <input name="telegram" value={editForm.telegram} onChange={handleEditChange} className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent transition-colors duration-150" placeholder="Telegram" maxLength={64} />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Manzil</label>
                      <input name="address" value={editForm.address} onChange={handleEditChange} className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent transition-colors duration-150" placeholder="Manzil" maxLength={255} />
                    </div>
                    {/* Parolni o'zgartirish faqat alohida modal orqali */}
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Bio</label>
                      <textarea name="bio" value={editForm.bio} onChange={handleEditChange} className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent transition-colors duration-150" placeholder="Bio" />
                    </div>
                  </div>
                </div>
                <hr className="my-2 border-surface-200 dark:border-surface-700" />
                {/* Contact Info Section */}
                <div>
                  <div className="text-xs sm:text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">Aloqa ma'lumotlari</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Telefon</label>
                      <input name="phone" value={editForm.phone} onChange={handleEditChange} className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent transition-colors duration-150" placeholder="Telefon" maxLength={20} />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Tug'ilgan sana</label>
                      <input name="birth_date" type="date" value={editForm.birth_date} onChange={handleEditChange} className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent transition-colors duration-150" placeholder="Tug'ilgan sana" />
                    </div>
                  </div>
                </div>
              </form>

              {/* Action Bar - Modal pastida */}
              <div className="border-t border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  form="editProfileForm"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed text-white font-semibold transition-colors duration-150 flex items-center gap-2"
                >
                  {isUpdating && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                  )}
                  {isUpdating ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Profile;
