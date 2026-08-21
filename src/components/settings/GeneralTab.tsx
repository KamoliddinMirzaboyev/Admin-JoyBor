import React, { useEffect, useState } from 'react';
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
  Upload,
  Locate,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/formatters';
import api, { get } from '../../data/api';
import { mediaUrl } from '../../data/config';
import type { DormitorySettings } from './types';

interface GeneralTabProps {
  settings: DormitorySettings;
  onSettingsUpdate: (settings: DormitorySettings) => void;
  editSection: string | null;
  setEditSection: (section: string | null) => void;
}

interface AdminMe {
  id?: number;
  phone?: string;
  telegram?: string;
  first_name?: string;
  last_name?: string;
}

function dormPhone(settings: DormitorySettings): string {
  return settings.phone_number || settings.phone_numer || '';
}

function adminIdOf(settings: DormitorySettings): number | undefined {
  if (typeof settings.admin === 'number') return settings.admin;
  if (settings.admin && typeof settings.admin === 'object') return settings.admin.id;
  return undefined;
}

function fileLabel(url?: string | null): string {
  if (!url) return '';
  try {
    return decodeURIComponent(url.split('?')[0].split('/').pop() || 'shartnoma');
  } catch {
    return 'shartnoma';
  }
}

function apiErrorMessage(err: unknown): string {
  const e = err as Error & { response?: { data?: Record<string, unknown> } };
  const data = e.response?.data;
  if (data && typeof data === 'object') {
    const field = Object.entries(data).find(([, value]) => value != null && value !== '');
    if (field) {
      const [key, value] = field;
      const msg = Array.isArray(value) ? String(value[0]) : String(value);
      if (key !== 'detail' && key !== 'message') return `${key}: ${msg}`;
      return msg;
    }
  }
  return e.message || 'Saqlashda xatolik yuz berdi';
}

function formatPhoneNumber(value: string): string {
  // Strip everything except digits
  let digits = value.replace(/\D/g, '');

  // If empty, show placeholder
  if (!digits) return '';

  // If user typed without +998 prefix, remove leading 998 if present
  // then re-add it during formatting
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }

  // Limit to 9 digits (Uzbekistan local number)
  digits = digits.slice(0, 9);

  // Format: +998 (XX) XXX-XX-XX
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `+998 (${digits}`;
  if (digits.length <= 5) return `+998 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `+998 (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5)}`;
  return `+998 (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7)}`;
}

function cleanPhoneNumber(value: string) {
  return value.replace(/\D/g, '');
}

async function refetchSettings(): Promise<DormitorySettings> {
  try {
    return (await get('/admin/my-dormitory/')) as DormitorySettings;
  } catch {
    const data = (await get('/admin/my-dormitories/')) as { results?: DormitorySettings[] } & Partial<DormitorySettings>;
    return data.results && data.results.length > 0 ? data.results[0] : (data as DormitorySettings);
  }
}

export default function GeneralTab({ settings, onSettingsUpdate }: GeneralTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminMe, setAdminMe] = useState<AdminMe | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [locating, setLocating] = useState(false);

  const [formData, setFormData] = useState({
    name: settings.name || '',
    address: settings.address || '',
    distance: settings.distance ? String(settings.distance) : '',
    latitude: settings.latitude != null ? String(settings.latitude) : '',
    longitude: settings.longitude != null ? String(settings.longitude) : '',
    phone_number: formatPhoneNumber(dormPhone(settings) || ''),
    link: settings.link || '',
    month_price: settings.month_price ? String(settings.month_price) : '',
    year_price: settings.year_price ? String(settings.year_price) : '',
    admin_phone: '',
    admin_telegram: '',
    description: settings.description || '',
  });

  useEffect(() => {
    let cancelled = false;
    get('/me/')
      .then((data) => {
        if (cancelled) return;
        const me = data as AdminMe;
        setAdminMe(me);
        setFormData((prev) => ({
          ...prev,
          admin_phone: prev.admin_phone || formatPhoneNumber(me.phone || ''),
          admin_telegram: prev.admin_telegram || me.telegram || '',
        }));
      })
      .catch(() => {
        /* /me/ ixtiyoriy */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentAmenityIds = () =>
    (settings.amenities as Array<{ id?: number } | number>)?.map((a) => (typeof a === 'object' ? a.id : a)) || [];

  const handleCancelEdit = () => {
    setFormData({
      name: settings.name || '',
      address: settings.address || '',
      distance: settings.distance ? String(settings.distance) : '',
      latitude: settings.latitude != null ? String(settings.latitude) : '',
      longitude: settings.longitude != null ? String(settings.longitude) : '',
      phone_number: formatPhoneNumber(dormPhone(settings) || ''),
      link: settings.link || '',
      month_price: settings.month_price ? String(settings.month_price) : '',
      year_price: settings.year_price ? String(settings.year_price) : '',
      admin_phone: formatPhoneNumber(adminMe?.phone || ''),
      admin_telegram: adminMe?.telegram || '',
      description: settings.description || '',
    });
    setContractFile(null);
    setIsEditing(false);
    toast.info("Tahrirlash bekor qilindi");
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Brauzeringiz joylashuvni aniqlashni qo'llab-quvvatlamaydi");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((f) => ({
          ...f,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
        setLocating(false);
        toast.success('Joylashuv aniqlandi');
      },
      () => {
        setLocating(false);
        toast.error("Joylashuvni aniqlab bo'lmadi. Brauzerga ruxsat bering");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleContractChange = (file: File | null) => {
    if (!file) {
      setContractFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fayl hajmi 10MB dan oshmasin');
      return;
    }
    setContractFile(file);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Yotoqxona nomini kiriting');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('Manzilni kiriting');
      return;
    }

    setLoading(true);
    try {
      const monthPrice = Math.round(parseFloat(formData.month_price) || 0);
      const yearPrice = Math.round(parseFloat(formData.year_price) || 0);
      const distance = parseFloat(formData.distance) || 0;
      const cleanPhone = cleanPhoneNumber(formData.phone_number);
      const phoneNumber = cleanPhone.length >= 9 ? `+${cleanPhone}` : '';

      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        distance,
        link: formData.link.trim(),
        description: formData.description.trim(),
        month_price: monthPrice,
        year_price: yearPrice,
        amenities: currentAmenityIds().filter((id): id is number => typeof id === 'number'),
      };
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (!isNaN(lat)) payload.latitude = lat;
      if (!isNaN(lng)) payload.longitude = lng;
      if (settings.university != null) payload.university = settings.university;
      const adminId = adminIdOf(settings) ?? adminMe?.id;
      if (adminId != null) payload.admin = adminId;
      if (typeof settings.is_active === 'boolean') payload.is_active = settings.is_active;
      if (cleanPhone.length >= 9 && /^\+?\d{7,15}$/.test(phoneNumber)) {
        payload.phone_number = phoneNumber;
      } else {
        payload.phone_number = '';
      }
      if (contractFile) {
        payload.file = contractFile;
      }

      await api.updateMyDormitory(payload);

      const cleanAdminPhone = cleanPhoneNumber(formData.admin_phone);
      const updateAdmin: Record<string, string> = {};
      // Allow clearing phone by sending empty string
      updateAdmin.phone = cleanAdminPhone.length >= 9 ? `+${cleanAdminPhone}` : '';
      if (formData.admin_telegram.trim()) updateAdmin.telegram = formData.admin_telegram.trim();
      if (Object.keys(updateAdmin).length > 0) {
        await api.updateAdminProfile(updateAdmin);
      }

      const updated = await refetchSettings();
      onSettingsUpdate(updated);
      setContractFile(null);
      setIsEditing(false);
      toast.success("Sozlamalar saqlandi");
    } catch (err) {
      toast.error(apiErrorMessage(err));
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

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400">
                      Xarita Koordinatalari (Latitude / Longitude)
                    </label>
                    <button
                      type="button"
                      onClick={handleLocateMe}
                      disabled={locating}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 disabled:opacity-50"
                    >
                      <Locate className={`w-3.5 h-3.5 ${locating ? 'animate-pulse' : ''}`} />
                      <span>{locating ? 'Aniqlanmoqda...' : 'Joylashuvni aniqlash'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.latitude}
                      onChange={(e) => setFormData((f) => ({ ...f, latitude: e.target.value }))}
                      placeholder="Latitude, masalan: 41.311081"
                      className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-surface-900 dark:text-white font-medium transition-colors"
                    />
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.longitude}
                      onChange={(e) => setFormData((f) => ({ ...f, longitude: e.target.value }))}
                      placeholder="Longitude, masalan: 69.240562"
                      className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-surface-900 dark:text-white font-medium transition-colors"
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
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, phone_number: formatPhoneNumber(e.target.value) }))
                      }
                      placeholder="+998 (90) 123-45-67"
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
                  {settings.latitude != null && settings.longitude != null && (
                    <a
                      href={`https://www.google.com/maps?q=${settings.latitude},${settings.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline mt-2"
                    >
                      <Locate className="w-3.5 h-3.5" />
                      <span>Xaritada ko'rish ({settings.latitude}, {settings.longitude})</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                      Yotoqxona telefoni
                    </p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-surface-900 dark:text-white">
                      <Phone className="w-4 h-4 text-brand-600 shrink-0" />
                      <span>{dormPhone(settings) ? formatPhoneNumber(dormPhone(settings)) : 'Kiritilmagan'}</span>
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

          {/* 3. SHARTNOMA */}
          <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-surface-100 dark:border-surface-800 pb-4">
              <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/40">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-surface-900 dark:text-white">
                  Shartnoma
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Yotoqxona shartnomasi (PDF, DOC yoki rasm)
                </p>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <label className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-dashed border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/40 cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,image/jpeg,image/png"
                    className="sr-only"
                    onChange={(e) => handleContractChange(e.target.files?.[0] || null)}
                  />
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold">
                    <Upload className="w-4 h-4" />
                    Fayl tanlash
                  </span>
                  <span className="text-sm text-surface-600 dark:text-surface-300 truncate">
                    {contractFile
                      ? contractFile.name
                      : settings.file
                        ? fileLabel(settings.file)
                        : 'Fayl tanlanmagan'}
                  </span>
                </label>
                {contractFile && (
                  <button
                    type="button"
                    onClick={() => setContractFile(null)}
                    className="text-xs font-medium text-danger-600"
                  >
                    Tanlovni bekor qilish
                  </button>
                )}
              </div>
            ) : settings.file ? (
              <a
                href={mediaUrl(settings.file)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span className="truncate max-w-[240px]">{fileLabel(settings.file)}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            ) : (
              <p className="text-sm text-surface-400">Shartnoma yuklanmagan</p>
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
                      placeholder="+998 (90) 123-45-67"
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
                    <span>{adminMe?.phone ? formatPhoneNumber(adminMe.phone) : 'Kiritilmagan'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                    Admin Telegram
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-surface-900 dark:text-white">
                    <Send className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>{adminMe?.telegram || 'Kiritilmagan'}</span>
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
