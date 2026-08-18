import React, { useEffect, useState } from 'react';
import { Info, ListChecks, FileImage, School } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import { get } from '../data/api';
import GeneralTab from '../components/settings/GeneralTab';
import AmenitiesTab from '../components/settings/AmenitiesTab';
import RulesTab from '../components/settings/RulesTab';
import ImagesTab from '../components/settings/ImagesTab';
import Skeleton from '../components/UI/Skeleton';
import type { DormitorySettings } from '../components/settings/types';

const TABS = [
  { id: 'general', label: 'Umumiy Ma\'lumotlar', icon: Info },
  { id: 'amenities', label: 'Qulayliklar', icon: ListChecks },
  { id: 'rules', label: 'Tartib Qoidalari', icon: ListChecks },
  { id: 'images', label: 'Yotoqxona Suratlari', icon: FileImage },
] as const;

type TabId = typeof TABS[number]['id'];

const Settings: React.FC = () => {
  useSEO('settings');

  const [settings, setSettings] = useState<DormitorySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [editSection, setEditSection] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = (await get('/admin/my-dormitories/')) as { results?: DormitorySettings[] } & Partial<DormitorySettings>;
        const dormitory = data.results && data.results.length > 0 ? data.results[0] : (data as DormitorySettings);
        setSettings(dormitory);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 md:col-span-2 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }
  if (error || !settings) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full text-center">
        <div className="p-6 bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 rounded-xl text-danger-700 dark:text-danger-300">
          Sozlamalarni yuklashda xatolik yuz berdi. Iltimos qayta urinib ko'ring.
        </div>
      </div>
    );
  }

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setEditSection(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.15, ease: 'easeInOut' }}
      className="space-y-6 w-full"
    >
      {/* Top Banner / Header Card */}
      <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-50 dark:bg-surface-800 rounded-xl flex items-center justify-center border border-brand-100 dark:border-surface-700 shadow-sm shrink-0 p-2">
            <img src="/logoicon.svg" alt="JoyBor" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-white truncate">
                {settings.name || settings.university_name || 'Yotoqxona Sozlamalari'}
              </h1>
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 truncate">
              {settings.address || settings.university_name || "Yotoqxona ma'lumotlarini boshqarish"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 px-3.5 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
              {(settings.admin_name?.[0] || 'A').toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-surface-900 dark:text-white leading-none">
                {settings.admin_name || (typeof settings.admin === 'object' ? settings.admin?.username : 'Admin')}
              </p>
              <p className="text-[10px] text-surface-500 leading-none mt-0.5">Yotoqxona Admini</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex gap-2 border-b border-surface-200 dark:border-surface-800 pb-3 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors shadow-sm ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 border border-surface-200 dark:border-surface-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'general' && (
        <GeneralTab
          settings={settings}
          onSettingsUpdate={setSettings}
          editSection={editSection}
          setEditSection={setEditSection}
        />
      )}

      {activeTab === 'amenities' && (
        <AmenitiesTab
          settings={settings}
          onSettingsUpdate={setSettings}
          editSection={editSection}
          setEditSection={setEditSection}
        />
      )}

      {activeTab === 'rules' && (
        <RulesTab editSection={editSection} setEditSection={setEditSection} />
      )}

      {activeTab === 'images' && (
        <ImagesTab
          settings={settings}
          onSettingsUpdate={setSettings}
          editSection={editSection}
          setEditSection={setEditSection}
        />
      )}
    </motion.div>
  );
};

export default Settings;
