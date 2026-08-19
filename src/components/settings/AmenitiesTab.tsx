import React, { useEffect, useState } from 'react';
import { ListChecks, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api, { get } from '../../data/api';
import { SectionCard, getAmenityIcon } from './shared';
import Skeleton from '../UI/Skeleton';
import type { Amenity, DormitorySettings } from './types';

interface AmenitiesTabProps {
  settings: DormitorySettings;
  onSettingsUpdate: (settings: DormitorySettings) => void;
  editSection: string | null;
  setEditSection: (section: string | null) => void;
}

function mapAmenities(all: Amenity[], settings: DormitorySettings): Amenity[] {
  const dormitoryAmenityIds = (settings.amenities as Array<{ id?: number } | number>)?.map((a) => (typeof a === 'object' ? a.id : a)) || [];
  return all.map(amenity => ({ ...amenity, is_active: dormitoryAmenityIds.includes(amenity.id) }));
}

async function refetchSettings(): Promise<DormitorySettings> {
  const data = await get('/admin/my-dormitories/');
  return data.results && data.results.length > 0 ? data.results[0] : data;
}

export default function AmenitiesTab({ settings, onSettingsUpdate, editSection, setEditSection }: AmenitiesTabProps) {
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [localAmenities, setLocalAmenities] = useState<Amenity[]>([]);
  const [amenitiesLoading, setAmenitiesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAmenities = async () => {
      setAmenitiesLoading(true);
      try {
        const data = await api.getAmenities();
        const amenitiesList = data?.results || data || [];
        setAllAmenities(Array.isArray(amenitiesList) ? amenitiesList : []);
      } catch {
        toast.error('Qulayliklarni yuklashda xatolik');
      } finally {
        setAmenitiesLoading(false);
      }
    };
    fetchAmenities();
  }, []);

  useEffect(() => {
    if (allAmenities.length > 0) {
      setLocalAmenities(mapAmenities(allAmenities, settings));
    }
  }, [allAmenities, settings]);

  const handleAmenityChange = (idx: number, value: string) => {
    setLocalAmenities(prev => prev.map((item, i) => i === idx ? { ...item, name: value } : item));
  };

  const handleAddAmenity = () => {
    setLocalAmenities(prev => [...prev, { id: 0, name: '', is_active: true }]);
  };

  const handleRemoveAmenity = async (idx: number) => {
    const amenityToRemove = localAmenities[idx];
    if (amenityToRemove.id) {
      try {
        await api.deleteAmenity(amenityToRemove.id);
        toast.success('Qulaylik o\'chirildi!');
      } catch {
        toast.error('Qulaylikni o\'chirishda xatolik!');
        return;
      }
    }
    setLocalAmenities(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAmenities = async () => {
    setSaving(true);
    try {
      const savedAmenityIds: number[] = [];

      for (const item of localAmenities) {
        if (!item.name.trim()) continue;

        let savedItem;
        if (item.id && item.id !== 0) {
          savedItem = await api.updateAmenity(item.id, { name: item.name, is_active: item.is_active });
        } else {
          savedItem = await api.createAmenity({ name: item.name, is_active: true });
        }

        const finalId = savedItem?.id || item.id;
        if (finalId && (item.is_active || !item.id)) {
          savedAmenityIds.push(Number(finalId));
        }
      }

      await api.updateMyDormitory({
        name: settings.name || '',
        address: settings.address || '',
        distance: Number(settings.distance) || 0,
        description: settings.description || '',
        month_price: Number(settings.month_price) || 0,
        year_price: Number(settings.year_price) || 0,
        amenities: [...new Set(savedAmenityIds)],
      });

      const amenitiesData = await api.getAmenities();
      const amenitiesList = amenitiesData?.results || amenitiesData || [];
      setAllAmenities(Array.isArray(amenitiesList) ? amenitiesList : []);
      onSettingsUpdate(await refetchSettings());

      toast.success('Qulayliklar muvaffaqiyatli saqlandi!');
      setEditSection(null);
    } catch (err) {
      toast.error((err as Error)?.message || 'Xatolik yuz berdi!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      icon={<ListChecks className="w-6 h-6" />}
      title="Qulayliklar"
      description="Yotoqxonada mavjud bo'lgan qulayliklar. Ro'yxatni tahrirlash va yangi qulaylik qo'shish mumkin."
      onEdit={() => setEditSection(editSection === 'amenities' ? null : 'amenities')}
    >
      {amenitiesLoading ? (
        <Skeleton className="h-12" count={4} />
      ) : (
        <ul className="space-y-3">
          {localAmenities.map((item, idx) => (
            <li key={idx} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  item.is_active
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
                }`}>
                  {getAmenityIcon(item.name)}
                </div>
                {editSection === 'amenities' ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      className="flex-1 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 focus:ring-2 focus:ring-brand-500/40 outline-none dark:text-white"
                      value={item.name}
                      onChange={e => handleAmenityChange(idx, e.target.value)}
                      placeholder="Qulaylik nomi..."
                    />
                    <label className="flex items-center gap-2 cursor-pointer bg-surface-50 dark:bg-surface-800 px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500/40"
                        checked={item.is_active}
                        onChange={() => setLocalAmenities(prev => prev.map((a, i) => i === idx ? { ...a, is_active: !a.is_active } : a))}
                      />
                      <span className="text-xs font-medium text-surface-600 dark:text-surface-400">Faol</span>
                    </label>
                    <button
                      onClick={() => handleRemoveAmenity(idx)}
                      className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-xl transition-colors duration-150"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`font-medium text-sm ${item.is_active ? 'text-surface-900 dark:text-white' : 'text-surface-400 line-through'}`}>
                      {item.name}
                    </span>
                    {item.is_active && (
                      <span className="text-[10px] font-bold text-success-600 dark:text-success-500 bg-success-50 dark:bg-success-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Faol</span>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {editSection === 'amenities' && (
        <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800 space-y-4">
          <button
            onClick={handleAddAmenity}
            className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-semibold hover:underline"
          >
            <Plus className="w-5 h-5" />
            Qulaylik qo'shish
          </button>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={handleSaveAmenities}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saqlanmoqda...
                </>
              ) : (
                'Saqlash'
              )}
            </button>
            <button
              className="px-6 py-2 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 rounded-xl font-bold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150"
              onClick={() => {
                setEditSection(null);
                if (allAmenities.length > 0) {
                  setLocalAmenities(mapAmenities(allAmenities, settings));
                }
              }}
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
