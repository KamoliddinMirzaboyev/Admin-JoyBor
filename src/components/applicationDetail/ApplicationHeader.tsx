import React from 'react';
import { Application, getStatusBadgeClasses, getStatusLabel } from './types';

interface ApplicationHeaderProps {
  application: Application;
  onImageClick: (image: string) => void;
}

const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({ application, onImageClick }) => (
  <div className="p-6 border-b border-surface-200 dark:border-surface-800">
    <div className="flex flex-col sm:flex-row items-start gap-6">
      {application.user_image && (
        <div
          className="flex-shrink-0 cursor-pointer group"
          onClick={() => onImageClick(application.user_image as string)}
        >
          <div className="relative w-32 h-32 rounded-lg overflow-hidden ring-2 ring-surface-200 dark:ring-surface-700 group-hover:ring-brand-500 transition-colors duration-150">
            <img
              src={application.user_image}
              alt="Talaba"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-150 flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs font-medium">
                Ko'rish
              </span>
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
            <p className="text-surface-600 dark:text-surface-400 mt-1">
              {application.middle_name}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap text-sm ${getStatusBadgeClasses(application.status)}`}>
            {getStatusLabel(application.status)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ApplicationHeader;
