import React, { useEffect, useState } from 'react';
import { Info, ListChecks, FileImage, User, School } from 'lucide-react';
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
  { id: 'general', label: 'Umumiy', icon: Info },
  { id: 'amenities', label: 'Qulayliklar', icon: ListChecks },
  { id: 'rules', label: 'Qoidalar', icon: ListChecks },
  { id: 'images', label: 'Suratlar', icon: FileImage },
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
        const data = await get('/admin/my-dormitories/');
        const dormitory = data.results && data.results.length > 0 ? data.results[0] : data;
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
      <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">
        <Skeleton className="h-16 w-full rounded-2xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }
  if (error || !settings) {
    return <div className="text-center py-10 text-danger-600 dark:text-danger-400">Sozlamalarni yuklashda xatolik yuz berdi.</div>;
  }

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setEditSection(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="p-4 sm:p-6 max-w-5xl mx-auto w-full"
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-surface-900 rounded-xl flex items-center justify-center border border-surface-200 dark:border-surface-800 shadow-sm p-2">
            <img src="/logoicon.svg" alt="University Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm sm:text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <School className="w-4 h-4 sm:w-5 sm:h-5 text-brand-500 flex-shrink-0" />
              <span className="truncate">{settings.university_name || 'Universitet'}</span>
            </div>
            <div className="text-xs text-surface-500 dark:text-surface-400 mt-1 truncate">{settings.address || ''}</div>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 bg-brand-50 dark:bg-brand-900/30 px-3 sm:px-4 py-2 rounded-xl">
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-brand-500 flex-shrink-0" />
          <span className="font-semibold text-surface-800 dark:text-surface-100 text-sm sm:text-base truncate">{settings.admin_name || (typeof settings.admin === 'object' ? settings.admin?.username : 'Admin')}</span>
          <span className="text-xs text-surface-500 ml-1 sm:ml-2 flex-shrink-0">Admin</span>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-surface-200 dark:border-surface-800 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors duration-150 ${
                isActive
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'general' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <GeneralTab settings={settings} onSettingsUpdate={setSettings} editSection={editSection} setEditSection={setEditSection} />
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-6">
          {activeTab === 'amenities' && (
            <AmenitiesTab settings={settings} onSettingsUpdate={setSettings} editSection={editSection} setEditSection={setEditSection} />
          )}
          {activeTab === 'rules' && (
            <RulesTab editSection={editSection} setEditSection={setEditSection} />
          )}
          {activeTab === 'images' && (
            <ImagesTab settings={settings} onSettingsUpdate={setSettings} editSection={editSection} setEditSection={setEditSection} />
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Settings;
