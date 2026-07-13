import React, { useState } from 'react';
import { DollarSign, Info, MapPin, Phone, School, Send, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/formatters';
import api, { get } from '../../data/api';
import { SectionCard, EditableInput } from './shared';
import type { DormitorySettings } from './types';

interface GeneralTabProps {
  settings: DormitorySettings;
  onSettingsUpdate: (settings: DormitorySettings) => void;
  editSection: string | null;
  setEditSection: (section: string | null) => void;
}

// Demo admin profil ma'lumotlari
const ADMIN_PROFILE = {
  id: 1,
  username: 'superadmin',
  first_name: 'Admin',
  last_name: 'Adminov',
  email: 'admin@joybor.uz',
  phone: '+998901234567',
  telegram: '@joyboradmin',
  bio: 'Yotoqxona administratori',
  avatar: null,
};

// Telefon raqamini formatlash funksiyasi
function formatPhoneNumber(value: string) {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 0) return '';

  let formattedNumbers = numbers;
  if (!numbers.startsWith('998') && numbers.startsWith('9')) {
    formattedNumbers = '998' + numbers;
  }

  if (formattedNumbers.length >= 12) {
    return `+${formattedNumbers.slice(0, 3)} (${formattedNumbers.slice(3, 5)}) ${formattedNumbers.slice(5, 8)} ${formattedNumbers.slice(8, 10)} ${formattedNumbers.slice(10, 12)}`;
  } else if (formattedNumbers.length >= 10) {
    return `+${formattedNumbers.slice(0, 3)} (${formattedNumbers.slice(3, 5)}) ${formattedNumbers.slice(5, 8)} ${formattedNumbers.slice(8, 10)} ${formattedNumbers.slice(10)}`;
  } else if (formattedNumbers.length >= 8) {
    return `+${formattedNumbers.slice(0, 3)} (${formattedNumbers.slice(3, 5)}) ${formattedNumbers.slice(5, 8)} ${formattedNumbers.slice(8)}`;
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
  const data = await get('/admin/my-dormitories/');
  return data.results && data.results.length > 0 ? data.results[0] : data;
}

export default function GeneralTab({ settings, onSettingsUpdate, editSection, setEditSection }: GeneralTabProps) {
  const [dormLoading, setDormLoading] = useState(false);
  const [editDormCard, setEditDormCard] = useState(false);
  const [editPricesCard, setEditPricesCard] = useState(false);
  const [editDescription, setEditDescription] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [descLoading, setDescLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const [dormCardForm, setDormCardForm] = useState({
    name: settings.name || '',
    address: settings.address || '',
    distance: settings.distance ? String(settings.distance) : '',
    phone_numer: settings.phone_numer || '',
    link: settings.link || '',
    latitude: settings.latitude ? String(settings.latitude) : '',
    longitude: settings.longitude ? String(settings.longitude) : '',
  });
  const [pricesCardForm, setPricesCardForm] = useState({
    month_price: settings.month_price ? String(settings.month_price) : '',
    year_price: settings.year_price ? String(settings.year_price) : '',
  });
  const [descriptionForm, setDescriptionForm] = useState(settings.description || '');
  const [contactForm, setContactForm] = useState({
    phone: ADMIN_PROFILE.phone ? formatPhoneNumber(ADMIN_PROFILE.phone) : '',
    telegram: ADMIN_PROFILE.telegram || '',
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi");
      return;
    }

    toast.promise(
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setDormCardForm(prev => ({
              ...prev,
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString()
            }));
            resolve(position);
          },
          (error) => reject(error)
        );
      }),
      {
        loading: 'Joylashuv aniqlanmoqda...',
        success: 'Joylashuv muvaffaqiyatli aniqlandi!',
        error: (err: GeolocationPositionError) => {
          if (err.code === 1) return 'Joylashuvga ruxsat berilmadi';
          if (err.code === 2) return 'Joylashuvni aniqlab bo\'lmadi';
          if (err.code === 3) return 'Vaqt tugadi';
          return 'Xatolik yuz berdi';
        }
      }
    );
  };

  const handleDormCardChange = (field: string, value: string) => {
    setDormCardForm(f => ({ ...f, [field]: value }));
  };
  const handlePricesCardChange = (field: string, value: string) => {
    setPricesCardForm(f => ({ ...f, [field]: value }));
  };

  const currentAmenityIds = () =>
    (settings.amenities as Array<{ id?: number } | number>)?.map((a) => (typeof a === 'object' ? a.id : a)) || [];

  const handleSaveDormCard = async () => {
    setDormLoading(true);
    try {
      await api.updateMyDormitory({
        name: dormCardForm.name,
        address: dormCardForm.address,
        distance: dormCardForm.distance ? parseFloat(dormCardForm.distance) : 0,
        phone_numer: dormCardForm.phone_numer,
        link: dormCardForm.link,
        latitude: dormCardForm.latitude ? parseFloat(dormCardForm.latitude) : 0,
        longitude: dormCardForm.longitude ? parseFloat(dormCardForm.longitude) : 0,
        description: settings.description || '',
        month_price: settings.month_price || 0,
        year_price: settings.year_price || 0,
        amenities: currentAmenityIds(),
      });
      onSettingsUpdate(await refetchSettings());
      toast.success('Yotoqxona maʼlumotlari yangilandi!');
      setEditDormCard(false);
    } catch (err) {
      toast.error((err as Error)?.message || 'Xatolik yuz berdi!');
    } finally {
      setDormLoading(false);
    }
  };

  const handleSavePricesCard = async () => {
    setPriceLoading(true);
    try {
      await api.updateMyDormitory({
        name: settings.name || '',
        address: settings.address || '',
        distance: settings.distance || 0,
        description: settings.description || '',
        month_price: pricesCardForm.month_price ? parseFloat(pricesCardForm.month_price) : 0,
        year_price: pricesCardForm.year_price ? parseFloat(pricesCardForm.year_price) : 0,
        amenities: currentAmenityIds(),
      });
      onSettingsUpdate(await refetchSettings());
      toast.success('Narx ma\'lumotlari yangilandi!');
      setEditPricesCard(false);
    } catch (err) {
      toast.error((err as Error)?.message || 'Xatolik yuz berdi!');
    } finally {
      setPriceLoading(false);
    }
  };

  const handleSaveDescription = async () => {
    setDescLoading(true);
    try {
      await api.updateMyDormitory({
        name: settings.name || '',
        address: settings.address || '',
        distance: settings.distance || 0,
        description: descriptionForm,
        month_price: settings.month_price || 0,
        year_price: settings.year_price || 0,
        amenities: currentAmenityIds(),
      });
      onSettingsUpdate(await refetchSettings());
      toast.success('Tavsif muvaffaqiyatli yangilandi!');
      setEditDescription(false);
    } catch (err) {
      toast.error((err as Error)?.message || 'Xatolik yuz berdi!');
    } finally {
      setDescLoading(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    setContactForm(f => ({ ...f, phone: value }));
  };

  const handleSaveContact = async () => {
    const cleanedPhone = cleanPhoneNumber(contactForm.phone);

    if (!cleanedPhone && !contactForm.telegram.trim()) {
      toast.error('Kamida bitta aloqa ma\'lumotini kiriting!');
      return;
    }
    if (cleanedPhone && cleanedPhone.length < 9) {
      toast.error('Telefon raqami noto\'g\'ri formatda!');
      return;
    }

    setContactLoading(true);
    try {
      const updateData: Record<string, string> = {};
      if (cleanedPhone) updateData.phone = cleanedPhone;
      if (contactForm.telegram.trim()) updateData.telegram = contactForm.telegram;

      await api.updateAdminProfile(updateData);

      toast.success('Aloqa ma\'lumotlari saqlandi!');
      setEditSection(null);

      if (cleanedPhone) {
        setContactForm(f => ({ ...f, phone: formatPhoneNumber(cleanedPhone) }));
      }
    } catch (err) {
      toast.error((err as Error)?.message || 'Xatolik yuz berdi!');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <>
      {/* Dormitory Info Card */}
      <SectionCard
        icon={<Info className="w-8 h-8 text-brand-600" />}
        title={<span className="text-base sm:text-lg font-bold text-surface-900 dark:text-white">Yotoqxona haqida</span>}
        onEdit={() => setEditDormCard(true)}
      >
        <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 p-4 flex flex-col gap-4 border border-surface-200 dark:border-surface-700">
          {editDormCard ? (
            <>
              <EditableInput label="Nomi" value={dormCardForm.name} onChange={v => handleDormCardChange('name', v)} disabled={dormLoading} fullWidth />
              <EditableInput label="Manzil" value={dormCardForm.address} onChange={v => handleDormCardChange('address', v)} disabled={dormLoading} fullWidth />
              <EditableInput label="Universitetgacha masofa (km)" value={dormCardForm.distance} onChange={v => handleDormCardChange('distance', v)} disabled={dormLoading} fullWidth />
              <EditableInput label="Telefon raqami" value={dormCardForm.phone_numer} onChange={v => handleDormCardChange('phone_numer', v)} disabled={dormLoading} fullWidth placeholder="+998901234567" />
              <EditableInput label="Havola (Link)" value={dormCardForm.link} onChange={v => handleDormCardChange('link', v)} disabled={dormLoading} fullWidth placeholder="https://..." />

              <div className="grid grid-cols-2 gap-3">
                <EditableInput label="Latitude" value={dormCardForm.latitude} onChange={v => handleDormCardChange('latitude', v)} disabled={dormLoading} fullWidth placeholder="41.2995" />
                <EditableInput label="Longitude" value={dormCardForm.longitude} onChange={v => handleDormCardChange('longitude', v)} disabled={dormLoading} fullWidth placeholder="69.2401" />
              </div>

              <button
                onClick={handleGetLocation}
                disabled={dormLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl border border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors duration-150 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <MapPin className="w-4 h-4" />
                Hozirgi joylashuvni aniqlash
              </button>

              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <button className="px-4 sm:px-6 py-2 rounded-xl bg-success-600 text-white font-semibold hover:bg-success-700 transition-colors duration-150 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-500/40" onClick={handleSaveDormCard} disabled={dormLoading}>{dormLoading ? 'Saqlanmoqda...' : 'Saqlash'}</button>
                <button className="px-4 sm:px-6 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 font-semibold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-500/40" onClick={() => setEditDormCard(false)} disabled={dormLoading}>Bekor qilish</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-surface-900 rounded-xl">
                <Info className="w-5 h-5 text-brand-600" />
                <div>
                  <div className="text-xs text-surface-500 dark:text-surface-400">Nomi</div>
                  <span className="font-semibold text-surface-900 dark:text-white">{settings.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-surface-900 rounded-xl">
                <MapPin className="w-5 h-5 text-brand-600" />
                <div>
                  <div className="text-xs text-surface-500 dark:text-surface-400">Manzil</div>
                  <span className="text-surface-900 dark:text-white">{settings.address}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-surface-900 rounded-xl">
                <School className="w-5 h-5 text-brand-600" />
                <div>
                  <div className="text-xs text-surface-500 dark:text-surface-400">Universitetgacha masofa</div>
                  <span className="text-surface-900 dark:text-white">{settings.distance} km</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-surface-900 rounded-xl">
                <Phone className="w-5 h-5 text-brand-600" />
                <div>
                  <div className="text-xs text-surface-500 dark:text-surface-400">Telefon raqami</div>
                  <span className="text-surface-900 dark:text-white">{settings.phone_numer || 'Kiritilmagan'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-surface-900 rounded-xl">
                <Info className="w-5 h-5 text-brand-600" />
                <div>
                  <div className="text-xs text-surface-500 dark:text-surface-400">Havola</div>
                  <span className="text-surface-900 dark:text-white truncate max-w-[200px] block">
                    {settings.link ? (
                      <a href={settings.link} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">
                        {settings.link}
                      </a>
                    ) : (
                      'Kiritilmagan'
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-surface-900 rounded-xl">
                <MapPin className="w-5 h-5 text-brand-600" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-surface-500 dark:text-surface-400">Latitude</div>
                    <span className="text-surface-900 dark:text-white">{settings.latitude || 'Kiritilmagan'}</span>
                  </div>
                  <div>
                    <div className="text-xs text-surface-500 dark:text-surface-400">Longitude</div>
                    <span className="text-surface-900 dark:text-white">{settings.longitude || 'Kiritilmagan'}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SectionCard>

      {/* Prices Card */}
      <SectionCard
        icon={<DollarSign className="w-8 h-8 text-success-600" />}
        title={<span className="text-base sm:text-lg font-bold text-surface-900 dark:text-white">Narx ma'lumotlari</span>}
        description={editPricesCard ? undefined : "Oylik va yillik narxlar"}
        onEdit={() => setEditPricesCard(true)}
      >
        <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 p-4 flex flex-col gap-4 border border-surface-200 dark:border-surface-700">
          {editPricesCard ? (
            <>
              <EditableInput label="Oylik narx (so'm)" value={pricesCardForm.month_price} onChange={v => handlePricesCardChange('month_price', v)} disabled={priceLoading} fullWidth placeholder="1200000" />
              <EditableInput label="Yillik narx (so'm)" value={pricesCardForm.year_price} onChange={v => handlePricesCardChange('year_price', v)} disabled={priceLoading} fullWidth placeholder="12000000" />
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button className="px-4 sm:px-6 py-2 rounded-xl bg-success-600 text-white font-semibold hover:bg-success-700 transition-colors duration-150 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-500/40" onClick={handleSavePricesCard} disabled={priceLoading}>{priceLoading ? 'Saqlanmoqda...' : 'Saqlash'}</button>
                <button className="px-4 sm:px-6 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 font-semibold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-500/40" onClick={() => setEditPricesCard(false)} disabled={priceLoading}>Bekor qilish</button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-success-500" />
                  <span className="font-medium text-surface-700 dark:text-surface-300">Oylik narx</span>
                </div>
                <span className="font-bold text-success-600 dark:text-success-400">{formatCurrency(settings.month_price)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-success-500" />
                  <span className="font-medium text-surface-700 dark:text-surface-300">Yillik narx</span>
                </div>
                <span className="font-bold text-success-600 dark:text-success-400">{formatCurrency(settings.year_price)}</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Description Card */}
      <SectionCard
        icon={<Info className="w-8 h-8 text-info-600" />}
        title={<span className="text-base sm:text-lg font-bold text-surface-900 dark:text-white">Tavsif</span>}
        description={editDescription ? undefined : "Yotoqxona haqida batafsil ma'lumot"}
        onEdit={() => setEditDescription(true)}
      >
        <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 p-4 flex flex-col gap-4 border border-surface-200 dark:border-surface-700">
          {editDescription ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">Tavsif</label>
                <textarea
                  className="bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 text-surface-900 dark:text-white text-sm sm:text-base font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40 min-h-[120px] max-h-[300px] resize-y"
                  value={descriptionForm}
                  onChange={e => setDescriptionForm(e.target.value)}
                  disabled={descLoading}
                  placeholder="Yotoqxona haqida batafsil ma'lumot kiriting..."
                  maxLength={1000}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <button className="px-4 sm:px-6 py-2 rounded-xl bg-success-600 text-white font-semibold hover:bg-success-700 transition-colors duration-150 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-500/40" onClick={handleSaveDescription} disabled={descLoading}>{descLoading ? 'Saqlanmoqda...' : 'Saqlash'}</button>
                <button className="px-4 sm:px-6 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 font-semibold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-500/40" onClick={() => { setEditDescription(false); setDescriptionForm(settings.description || ''); }} disabled={descLoading}>Bekor qilish</button>
              </div>
            </>
          ) : (
            <div className="p-3 bg-white dark:bg-surface-900 rounded-xl max-h-[200px] overflow-y-auto">
              <div className="text-surface-900 dark:text-white leading-relaxed whitespace-pre-wrap break-words">
                {settings.description || 'Tavsif kiritilmagan'}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Contact Section - Admin Profile dan */}
      <SectionCard
        icon={<User className="w-6 h-6" />}
        title="Aloqa ma'lumotlari"
        description="Admin profil ma'lumotlaridan olingan aloqa ma'lumotlari"
        onEdit={() => setEditSection(editSection === 'contact' ? null : 'contact')}
      >
        <div className="space-y-4">
          {editSection === 'contact' ? (
            <>
              <EditableInput
                label="Telefon raqami"
                value={contactForm.phone}
                onChange={handlePhoneChange}
                disabled={false}
                placeholder="+998 90 123 45 67"
                fullWidth
                maxLength={19}
              />
              <EditableInput
                label="Telegram"
                value={contactForm.telegram}
                onChange={v => setContactForm(f => ({ ...f, telegram: v }))}
                disabled={false}
                placeholder="@username"
                fullWidth
              />
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  className="px-4 sm:px-6 py-2 rounded-xl bg-success-600 text-white font-semibold hover:bg-success-700 transition-colors duration-150 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  onClick={handleSaveContact}
                  disabled={contactLoading}
                >
                  {contactLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saqlanmoqda...
                    </>
                  ) : (
                    'Saqlash'
                  )}
                </button>
                <button
                  className="px-4 sm:px-6 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 font-semibold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  onClick={() => {
                    setEditSection(null);
                    setContactForm({
                      phone: ADMIN_PROFILE.phone ? formatPhoneNumber(ADMIN_PROFILE.phone) : '',
                      telegram: ADMIN_PROFILE.telegram || ''
                    });
                  }}
                >
                  Bekor qilish
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700">
                <Phone className="w-5 h-5 text-brand-600" />
                <div>
                  <div className="text-xs text-surface-500 dark:text-surface-400">Telefon raqami</div>
                  <div className="text-surface-900 dark:text-white font-semibold">
                    {ADMIN_PROFILE.phone ? formatPhoneNumber(ADMIN_PROFILE.phone) : 'Kiritilmagan'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700">
                <Send className="w-5 h-5 text-brand-600" />
                <div>
                  <div className="text-xs text-surface-500 dark:text-surface-400">Telegram</div>
                  <div className="text-surface-900 dark:text-white font-semibold">
                    {ADMIN_PROFILE.telegram || 'Kiritilmagan'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SectionCard>
    </>
  );
}
