import React, { useRef, useState } from 'react';
import { FileImage } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api, { get } from '../../data/api';
import { SectionCard } from './shared';
import EmptyState from '../UI/EmptyState';
import type { DormitorySettings } from './types';

interface ImagesTabProps {
  settings: DormitorySettings;
  onSettingsUpdate: (settings: DormitorySettings) => void;
  editSection: string | null;
  setEditSection: (section: string | null) => void;
}

async function refetchSettings(): Promise<DormitorySettings> {
  const data = await get('/admin/my-dormitories/');
  return data.results && data.results.length > 0 ? data.results[0] : data;
}

export default function ImagesTab({ settings, onSettingsUpdate, editSection, setEditSection }: ImagesTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteImageModal, setDeleteImageModal] = useState<{ show: boolean; imageId: number | null; imageUrl: string | null }>({ show: false, imageId: null, imageUrl: null });

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Rasm hajmi 5MB dan oshmasligi kerak!');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm fayllari yuklanadi!');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('dormitory', String(settings.id));

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await api.uploadDormitoryImage(formData);

      clearInterval(progressInterval);
      setUploadProgress(95);

      onSettingsUpdate(await refetchSettings());
      setUploadProgress(100);

      setTimeout(() => toast.success('Rasm muvaffaqiyatli yuklandi!'), 300);
    } catch (err) {
      toast.error((err as Error)?.message || 'Rasm yuklashda xatolik!');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async () => {
    if (!deleteImageModal.imageId) return;

    setIsDeleting(true);
    try {
      await api.deleteDormitoryImage(deleteImageModal.imageId);
      onSettingsUpdate(await refetchSettings());
      toast.success('Rasm o\'chirildi!');
      setDeleteImageModal({ show: false, imageId: null, imageUrl: null });
    } catch (err) {
      toast.error((err as Error)?.message || 'Rasmni o\'chirishda xatolik!');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <SectionCard
        icon={<FileImage className="w-6 h-6" />}
        title="Yotoqxona suratlari"
        description="Yotoqxona va xonalar haqidagi suratlar."
        onEdit={() => setEditSection(editSection === 'images' ? null : 'images')}
      >
        {editSection === 'images' && (
          <div className="mb-4">
            <button
              className="px-3 sm:px-4 py-2 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors duration-150 mb-2 flex items-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Yuklanmoqda...' : "+ Rasm qo'shish"}
            </button>

            {isUploading && (
              <div className="mt-3 bg-surface-100 dark:bg-surface-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-surface-600 dark:text-surface-300">Yuklanmoqda...</span>
                  <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
          </div>
        )}

        {settings.images && settings.images.length > 0 ? (
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
              {settings.images.map((img, i) => (
                <div key={img.id} className="relative flex-shrink-0 group">
                  <img
                    src={img.image}
                    alt={`Yotoqxona rasmi ${i + 1}`}
                    className="w-full sm:w-64 h-40 sm:h-48 object-cover rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md transition-shadow duration-150"
                  />
                  {editSection === 'images' && (
                    <button
                      onClick={() => setDeleteImageModal({ show: true, imageId: img.id, imageUrl: img.image })}
                      className="absolute top-2 right-2 bg-danger-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-danger-600 transition-colors duration-150 shadow-sm"
                      title="Rasmni o'chirish"
                    >
                      <span className="text-lg font-bold">×</span>
                    </button>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {i + 1} / {settings.images?.length || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={FileImage}
            title="Hozircha rasmlar yuklanmagan"
            description={editSection !== 'images' ? 'Rasm yuklash uchun "Tahrirlash" tugmasini bosing' : undefined}
          />
        )}
      </SectionCard>

      {deleteImageModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-surface-200 dark:border-surface-800">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">Rasmni o'chirish</h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Bu amalni bekor qilib bo'lmaydi</p>
            </div>

            <div className="p-6">
              {deleteImageModal.imageUrl && (
                <div className="mb-4">
                  <img
                    src={deleteImageModal.imageUrl}
                    alt="O'chiriladigan rasm"
                    className="w-full h-48 object-cover rounded-xl border border-surface-200 dark:border-surface-700"
                  />
                </div>
              )}
              <p className="text-surface-700 dark:text-surface-300">
                Rostdan ham bu rasmni o'chirmoqchimisiz?
              </p>
              <p className="text-sm text-danger-600 dark:text-danger-400 mt-2">
                Bu amal qaytarilmaydi va rasm butunlay yo'qoladi.
              </p>
            </div>

            <div className="p-6 bg-surface-50 dark:bg-surface-950 flex gap-3 justify-end">
              <button
                onClick={() => setDeleteImageModal({ show: false, imageId: null, imageUrl: null })}
                disabled={isDeleting}
                className="px-4 py-2 text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors duration-150 border border-surface-300 dark:border-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDeleteImage}
                disabled={isDeleting}
                className="px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    O'chirilmoqda...
                  </>
                ) : (
                  'O\'chirish'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
