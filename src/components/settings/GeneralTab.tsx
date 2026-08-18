import React, { useState } from 'react';
import {
  DollarSign,
  Info,
  MapPin,
  Phone,
  School,
  Send,
  User,
  Globe,
  FileText,
  Save,
  Pencil,
  X,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/formatters';
import api, { get } from '../../data/api';
import type { DormitorySettings } from './types';

interface GeneralTabProps {
  settings: DormitorySettings;
  onSettingsUpdate: (settings: DormitorySettings) => void;
  editSection: string | null;
  setEditSection: (section: string | null) => void;
}

const ADMIN_PROFILE = {
  id: 1,
  username: 'dxshadmin',
  first_name: 'Admin',
  last_name: 'Adminov',
  email: 'admin@joybor.uz',
  phone: '+998901234567',
  telegram: '@joyboradmin',
  bio: 'Yotoqxona administratori',
  avatar: null,
};

function formatPhoneNumber(value: string) {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 0) return '+998 ';

  let formattedNumbers = numbers;
  if (!numbers.startsWith('998') && numbers.startsWith('9')) {
    formattedNumbers = '998' + numbers;
  }

  if (formattedNumbers.length >= 12) {
    return `+${formattedNumbers.slice(0, 3)} (${formattedNumbers.slice(3, 5)}) ${formattedNumbers.slice(5, 8)} ${formattedNumbers.slice(8, 10)} ${formattedNumbers.slice(10, 12)}`;
  } else if (formattedNumbers.length >= 10) {
    return `+${formattedNumbers.slice(0, 3)} (${formattedNumbers.slice(3, 5)}) ${formattedNumbers.slice(5, 8)} ${formattedNumbers.slice(8, 10)}`;
  } else if (formattedNumbers.length >= 8) {
    return `+${formattedNumbers.slice(0, 3)} (${formattedNumbers.slice(3, 5)}) ${formattedNumbers.slice(5, 8)}`;
  } else if (formattedNumbers.length >= 5) {
    return `+${formattedNumbers.slice(0, 3)} (${formattedNumbers.slice(3, 5)}) ${formattedNumbers.slice(5)}`;
  } else if (formattedNumbers.length >= 3) {
    return `+${formattedNumbers.slice(0, 3)} (${formattedNumbers.slice(3)}`;
  }
  return `+${formattedNumbers}`;
}

function cleanPhoneNumber(value: string) {
  return value.replace(/\D/g, '');
}

async function refetchSettings(): Promise<DormitorySettings> {
  const data = (await get('/admin/my-dormitories/')) as { results?: DormitorySettings[] } & Partial<DormitorySettings>;
  return data.results && data.results.length > 0 ? data.results[0] : (data as DormitorySettings);
}

export default function GeneralTab({ settings, onSettingsUpdate }: GeneralTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: settings.name || '',
    address: settings.address || '',
    distance: settings.distance ? String(settings.distance) : '',
    phone_numer: settings.phone_numer ? formatPhoneNumber(settings.phone_numer) : '+998 ',
    link: settings.link || '',
    month_price: settings.month_price ? String(settings.month_price) : '',
    year_price: settings.year_price ? String(settings.year_price) : '',
    admin_phone: ADMIN_PROFILE.phone ? formatPhoneNumber(ADMIN_PROFILE.phone) : '+998 ',
    admin_telegram: ADMIN_PROFILE.telegram || '',
    description: settings.description || '',
  });

  const currentAmenityIds = () =>
    (settings.amenities as Array<{ id?: number } | number>)?.map((a) => (typeof a === 'object' ? a.id : a)) || [];

  const handleCancelEdit = () => {
    setFormData({
      name: settings.name || '',
      address: settings.address || '',
      distance: settings.distance ? String(settings.distance) : '',
      phone_numer: settings.phone_numer ? formatPhoneNumber(settings.phone_numer) : '+998 ',
      link: settings.link || '',
      month_price: settings.month_price ? String(settings.month_price) : '',
      year_price: settings.year_price ? String(settings.year_price) : '',
      admin_phone: ADMIN_PROFILE.phone ? formatPhoneNumber(ADMIN_PROFILE.phone) : '+998 ',
      admin_telegram: ADMIN_PROFILE.telegram || '',
      description: settings.description || '',
    });
    setIsEditing(false);
    toast.info("Tahrirlash bekor qilindi");
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Yotoqxona nomini kiriting');
      return;
    }

    setLoading(true);
    try {
      const monthPrice = parseFloat(formData.month_price) || 0;
      const yearPrice = parseFloat(formData.year_price) || 0;
      const distance = parseFloat(formData.distance) || 0;
      const cleanPhone = cleanPhoneNumber(formData.phone_numer);

      // 1. Update Dormitory
      await api.updateMyDormitory({
        name: formData.name.trim(),
        address: formData.address.trim(),
        distance,
        phone_numer: cleanPhone ? `+${cleanPhone}` : '',
        link: formData.link.trim(),
        latitude: settings.latitude || 0,
        longitude: settings.longitude || 0,
        description: formData.description.trim(),
        month_price: monthPrice,
        year_price: yearPrice,
        amenities: currentAmenityIds(),
      });

      // 2. Update Admin Profile
      const cleanAdminPhone = cleanPhoneNumber(formData.admin_phone);
      const updateAdmin: Record<string, string> = {};
      if (cleanAdminPhone) updateAdmin.phone = cleanAdminPhone;
      if (formData.admin_telegram.trim()) updateAdmin.telegram = formData.admin_telegram.trim();

      if (Object.keys(updateAdmin).length > 0) {
        await api.updateAdminProfile(updateAdmin);
      }

      const updated = await refetchSettings();
      onSettingsUpdate(updated);
      setIsEditing(false);
      toast.success("Barcha sozlamalar muvaffaqiyatli saqlandi");
    } catch (err) {
      toast.error((err as Error)?.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="w-full space-y-6">
      {/* TOP HEADER ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <span>Yotoqxona Ma'lumotlari va Tariflar</span>
          </h2>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            {isEditing
              ? "Ma'lumotlarni o'zgartiring va saqlash tugmasini bosing"
              : "Yotoqxona ma'lumotlarini o'zgartirish uchun tahrirlash tugmasidan foydalaning"}
          </p>
        </div>

        <div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs sm:text-sm font-semibold transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Bekor qilish</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saqlanmoqda...' : 'Saqlash'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            >
              <Pencil className="w-4 h-4" />
              <span>Tahrirlash</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN 2-COLUMN + 1-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ========================================================= */}
        {/* CHAP QISM (2 TA USTUN: ASOSIY MA'LUMOTLAR VA TAVSIF) */}
        {/* ========================================================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. ASOSIY PARAMETRLAR */}
          <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-surface-100 dark:border-surface-800 pb-4">
              <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/40">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-surface-900 dark:text-white">
                  Yotoqxona Asosiy Ma'lumotlari
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Nomi, joylashgan manzili va aloqa vositalari
                </p>
              </div>
            </div>

            {isEditing ? (
              /* EDIT MODE: CLEAN FORM INPUTS */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                    Yotoqxona Nomi *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Masalan: FDTU DXSH 3"
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-surface-900 dark:text-white font-medium transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                    Manzil *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
                      placeholder="Farg'ona shahar, Universitet ko'chasi 15"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-surface-900 dark:text-white font-medium transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                    Universitetgacha Masofa (km)
                  </label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      value={formData.distance}
                      onChange={(e) => setFormData((f) => ({ ...f, distance: e.target.value }))}
                      placeholder="0.5"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-surface-900 dark:text-white font-medium transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                    Yotoqxona Telefon Raqami
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="text"
                      value={formData.phone_numer}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, phone_numer: formatPhoneNumber(e.target.value) }))
                      }
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-surface-900 dark:text-white font-mono transition-colors"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                    Rasmiy Vebsayt yoki Havola
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData((f) => ({ ...f, link: e.target.value }))}
                      placeholder="https://fdtu.uz yoki https://t.me/yotoqxona"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-surface-900 dark:text-white font-medium transition-colors"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW MODE: ELEGANT KEY-VALUE DISPLAY */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                      Yotoqxona Nomi
                    </p>
                    <p className="text-base font-bold text-surface-900 dark:text-white">
                      {settings.name || '—'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                      Universitetgacha masofa
                    </p>
                    <p className="text-base font-semibold text-surface-900 dark:text-white">
                      {settings.distance ? `${settings.distance} km` : 'Kiritilmagan'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                    Joylashgan Manzil
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-surface-900 dark:text-white">
                    <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>{settings.address || 'Kiritilmagan'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                      Yotoqxona telefoni
                    </p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-surface-900 dark:text-white">
                      <Phone className="w-4 h-4 text-brand-600 shrink-0" />
                      <span>{settings.phone_numer ? formatPhoneNumber(settings.phone_numer) : 'Kiritilmagan'}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                      Rasmiy Havola
                    </p>
                    {settings.link ? (
                      <a
                        href={settings.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline truncate max-w-full"
                      >
                        <Globe className="w-4 h-4 shrink-0" />
                        <span className="truncate">{settings.link}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-sm text-surface-400 font-medium">Kiritilmagan</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. YOTOQXONA TAVSIFI */}
          <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-surface-100 dark:border-surface-800 pb-4">
              <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/40">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-surface-900 dark:text-white">
                  Yotoqxona Haqida Batafsil Tavsif
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Talabalar saytida ko'rinadigan to'liq ma'lumot va qulayliklar matni
                </p>
              </div>
            </div>

            {isEditing ? (
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="Yotoqxona sharoitlari, joylashuvi va talabalar uchun yaratilgan imkoniyatlar haqida batafsil ma'lumot yozing..."
                className="w-full p-3.5 text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-surface-900 dark:text-white leading-relaxed transition-colors"
              />
            ) : (
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800 text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap min-h-[90px]">
                {settings.description || "Hozircha yotoqxona tavsifi kiritilmagan. Tahrirlash tugmasini bosib tavsif yozishingiz mumkin."}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* O'NG QISM (1 TA USTUN: TARIFLAR VA ADMIN ALOQASI) */}
        {/* ========================================================= */}
        <div className="space-y-6">
          {/* 1. IJARA NARXLARI (TARIFLAR) */}
          <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-surface-100 dark:border-surface-800 pb-4">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-surface-900 dark:text-white">
                  Ijara Narxlari (Tariflar)
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Talabalar uchun oylik va yillik to'lovlar
                </p>
              </div>
            </div>

            {isEditing ? (
              /* EDIT MODE: NUMBER INPUTS */
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                    Oylik Ijara Narxi (so'm) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      required
                      value={formData.month_price}
                      onChange={(e) => setFormData((f) => ({ ...f, month_price: e.target.value }))}
                      placeholder="400000"
                      className="w-full px-3.5 py-2.5 pr-20 text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-surface-900 dark:text-white font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-surface-400">
                      so'm / oy
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                    Yillik Ijara Narxi (so'm) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={50000}
                      required
                      value={formData.year_price}
                      onChange={(e) => setFormData((f) => ({ ...f, year_price: e.target.value }))}
                      placeholder="4000000"
                      className="w-full px-3.5 py-2.5 pr-20 text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-surface-900 dark:text-white font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-surface-400">
                      so'm / yil
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW MODE: BEAUTIFUL PRICING CARDS */
              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-surface-500">
                      Oylik To'lov
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                      Oyiga
                    </span>
                  </div>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">
                    {formatCurrency(settings.month_price)}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    1 nafar talaba uchun oylik to'lov
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-surface-500">
                      Yillik To'lov
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/40">
                      Yiliga
                    </span>
                  </div>
                  <p className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1 tracking-tight">
                    {formatCurrency(settings.year_price)}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    To'liq 10 oylik o'quv yili uchun to'lov
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2. MA'MURIYAT VA ALOQA */}
          <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-surface-100 dark:border-surface-800 pb-4">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-surface-900 dark:text-white">
                  Ma'muriyat va Aloqa
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Talabalar uchun admin aloqa vositalari
                </p>
              </div>
            </div>

            {isEditing ? (
              /* EDIT MODE */
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                    Admin Telefon Raqami
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="text"
                      value={formData.admin_phone}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, admin_phone: formatPhoneNumber(e.target.value) }))
                      }
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-surface-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                    Admin Telegram (@username)
                  </label>
                  <div className="relative">
                    <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
                    <input
                      type="text"
                      value={formData.admin_telegram}
                      onChange={(e) => setFormData((f) => ({ ...f, admin_telegram: e.target.value }))}
                      placeholder="@joyboradmin"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-surface-900 dark:text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW MODE */
              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                    Admin Telefon Raqami
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-surface-900 dark:text-white font-mono">
                    <Phone className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>{ADMIN_PROFILE.phone ? formatPhoneNumber(ADMIN_PROFILE.phone) : 'Kiritilmagan'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                    Admin Telegram
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-surface-900 dark:text-white">
                    <Send className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>{ADMIN_PROFILE.telegram || 'Kiritilmagan'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
