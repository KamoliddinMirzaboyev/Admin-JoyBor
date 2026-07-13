import React from 'react';
import { CreditCard, FileText } from 'lucide-react';
import { Application } from './types';

interface ApplicationDocumentsProps {
  application: Application;
  onImageClick: (image: string) => void;
}

const DocumentTile: React.FC<{ src: string; alt: string; label: string; onClick: () => void; maxWidth?: boolean }> = ({ src, alt, label, onClick, maxWidth }) => (
  <div
    className={`group relative bg-surface-50 dark:bg-surface-800/50 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-brand-500 transition-colors duration-150 ${maxWidth ? 'max-w-md' : ''}`}
    onClick={onClick}
  >
    <img src={src} alt={alt} className="w-full h-64 object-cover" />
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-150 flex items-center justify-center">
      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-sm font-medium">
        Ko'rish
      </span>
    </div>
    <div className="p-3 bg-white dark:bg-surface-900">
      <div className="text-sm font-medium text-surface-700 dark:text-surface-300">{label}</div>
    </div>
  </div>
);

const ApplicationDocuments: React.FC<ApplicationDocumentsProps> = ({ application, onImageClick }) => (
  <>
    {(application.passport_image_first || application.passport_image_second) && (
      <div>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-600" />
          Pasport rasmlari
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {application.passport_image_first && (
            <DocumentTile
              src={application.passport_image_first}
              alt="Pasport old tomoni"
              label="Pasport (old tomoni)"
              onClick={() => onImageClick(application.passport_image_first as string)}
            />
          )}
          {application.passport_image_second && (
            <DocumentTile
              src={application.passport_image_second}
              alt="Pasport orqa tomoni"
              label="Pasport (orqa tomoni)"
              onClick={() => onImageClick(application.passport_image_second as string)}
            />
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
        <DocumentTile
          src={application.document}
          alt="Qo'shimcha hujjat"
          label="Qo'shimcha hujjat"
          onClick={() => onImageClick(application.document as string)}
          maxWidth
        />
      </div>
    )}
  </>
);

export default ApplicationDocuments;
