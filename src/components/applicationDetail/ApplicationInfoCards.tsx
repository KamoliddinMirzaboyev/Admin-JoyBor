import React from 'react';
import { MapPin, GraduationCap, User, CreditCard, MessageSquare } from 'lucide-react';
import { Application, normalizeStatus } from './types';

interface ApplicationInfoCardsProps {
  application: Application;
}

const InfoTile: React.FC<{ label: string; icon?: React.ReactNode; children: React.ReactNode; small?: boolean }> = ({ label, icon, children, small }) => (
  <div className="bg-surface-50 dark:bg-surface-800/50 rounded-lg p-4">
    <div className="text-xs text-surface-500 dark:text-surface-400 mb-1 flex items-center gap-1">
      {icon}
      {label}
    </div>
    <div className={`text-surface-900 dark:text-white font-semibold ${small ? 'text-sm' : ''}`}>{children}</div>
  </div>
);

const ApplicationInfoCards: React.FC<ApplicationInfoCardsProps> = ({ application }) => (
  <>
    {/* Shaxsiy ma'lumotlar */}
    <div>
      <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-brand-600" />
        Shaxsiy ma'lumotlar
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoTile label="Pasport seriyasi" icon={<CreditCard className="w-3 h-3" />}>
          {application.passport}
        </InfoTile>
        <InfoTile label="Yashash manzili" icon={<MapPin className="w-3 h-3" />} small>
          {application.province_name}, {application.district_name}
        </InfoTile>
      </div>
    </div>

    {/* O'qish ma'lumotlari */}
    <div>
      <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-brand-600" />
        O'qish ma'lumotlari
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoTile label="Fakultet">{application.faculty}</InfoTile>
        <InfoTile label="Yo'nalish">{application.direction || '-'}</InfoTile>
        <InfoTile label="Kurs">{application.course}</InfoTile>
        <InfoTile label="Guruh">{application.group || '-'}</InfoTile>
      </div>
    </div>

    {/* Talaba izohi */}
    {application.comment && (
      <div>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-600" />
          Talaba izohi
        </h2>
        <div className="bg-info-50 dark:bg-info-900/20 rounded-lg p-4 border border-info-200 dark:border-info-800">
          <p className="text-surface-700 dark:text-surface-300">{application.comment}</p>
        </div>
      </div>
    )}

    {/* Admin izohi */}
    {application.admin_comment && (
      <div>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-600" />
          Admin izohi
        </h2>
        <div className={`rounded-lg p-4 border ${
          normalizeStatus(application.status) === 'APPROVED'
            ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
            : 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
        }`}>
          <p className="text-surface-700 dark:text-surface-300">{application.admin_comment}</p>
        </div>
      </div>
    )}
  </>
);

export default ApplicationInfoCards;
