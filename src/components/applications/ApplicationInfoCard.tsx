import React, { useState } from 'react';
import { MapPin, GraduationCap, User, FileText, MessageSquare, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import ImageLightbox from './ImageLightbox';
import { Application, getStatusColor, getStatusLabel } from './types';

function InfoTile({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4">
      <div className="text-xs text-surface-500 dark:text-surface-400 mb-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-surface-900 dark:text-white font-semibold">{value}</div>
    </div>
  );
}

function ImageTile({ src, alt, label, onClick }: { src: string; alt: string; label: string; onClick: () => void }) {
  return (
    <div
      className="group relative bg-surface-50 dark:bg-surface-800/50 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-brand-500 transition-shadow duration-150"
      onClick={onClick}
    >
      <img src={src} alt={alt} className="w-full h-64 object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-150 flex items-center justify-center">
        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-sm font-medium">Ko'rish</span>
      </div>
      <div className="p-3 bg-white dark:bg-surface-900">
        <div className="text-sm font-medium text-surface-700 dark:text-surface-300">{label}</div>
      </div>
    </div>
  );
}

export default function ApplicationInfoCard({ application }: { application: Application }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden mt-6"
    >
      <div className="p-6 border-b border-surface-200 dark:border-surface-800">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {application.user_image && (
            <div className="flex-shrink-0 cursor-pointer group" onClick={() => setSelectedImage(application.user_image)}>
              <div className="relative w-32 h-32 rounded-xl overflow-hidden ring-2 ring-surface-200 dark:ring-surface-700 group-hover:ring-brand-500 transition-colors duration-150">
                <img src={application.user_image} alt="Talaba" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-150 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs font-medium">Ko'rish</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                  {application.last_name} {application.name}
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">{application.middle_name}</p>
              </div>
              <div className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${getStatusColor(application.status)}`}>
                {getStatusLabel(application.status)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-600" />
            Shaxsiy ma'lumotlar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoTile icon={<CreditCard className="w-3 h-3" />} label="Pasport seriyasi" value={application.passport} />
            <InfoTile icon={<MapPin className="w-3 h-3" />} label="Yashash manzili" value={`${application.province_name}, ${application.district_name}`} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-600" />
            O'qish ma'lumotlari
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoTile label="Fakultet" value={application.faculty} />
            <InfoTile label="Yo'nalish" value={application.direction || '-'} />
            <InfoTile label="Kurs" value={application.course} />
            <InfoTile label="Guruh" value={application.group || '-'} />
          </div>
        </div>

        {application.comment && (
          <div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-600" />
              Talaba izohi
            </h2>
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 border border-brand-200 dark:border-brand-700">
              <p className="text-surface-700 dark:text-surface-300">{application.comment}</p>
            </div>
          </div>
        )}

        {(application.passport_image_first || application.passport_image_second) && (
          <div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-600" />
              Pasport rasmlari
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {application.passport_image_first && (
                <ImageTile src={application.passport_image_first} alt="Pasport old tomoni" label="Pasport (old tomoni)" onClick={() => setSelectedImage(application.passport_image_first)} />
              )}
              {application.passport_image_second && (
                <ImageTile src={application.passport_image_second} alt="Pasport orqa tomoni" label="Pasport (orqa tomoni)" onClick={() => setSelectedImage(application.passport_image_second)} />
              )}
            </div>
          </div>
        )}

        {application.document && (
          <div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              Qo'shimcha hujjat
            </h2>
            <div className="max-w-md">
              <ImageTile src={application.document} alt="Qo'shimcha hujjat" label="Qo'shimcha hujjat" onClick={() => setSelectedImage(application.document)} />
            </div>
          </div>
        )}

        {application.admin_comment && (
          <div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-600" />
              Admin izohi
            </h2>
            <div className={`rounded-xl p-4 border ${
              String(application.status).toUpperCase() === 'APPROVED'
                ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-700'
                : 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-700'
            }`}>
              <p className="text-surface-700 dark:text-surface-300">{application.admin_comment}</p>
            </div>
          </div>
        )}
      </div>

      <ImageLightbox src={selectedImage} onClose={() => setSelectedImage(null)} />
    </motion.div>
  );
}
