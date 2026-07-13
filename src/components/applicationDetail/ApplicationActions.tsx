import React from 'react';
import { Check, XCircle, UserPlus, Trash2 } from 'lucide-react';
import { Application, normalizeStatus } from './types';

interface ApplicationActionsProps {
  application: Application;
  onApprove: () => void;
  onReject: () => void;
  onAddStudent: () => void;
  onDelete: () => void;
}

const ApplicationActions: React.FC<ApplicationActionsProps> = ({ application, onApprove, onReject, onAddStudent, onDelete }) => {
  const status = normalizeStatus(application.status);

  return (
    <div className="pt-4 border-t border-surface-200 dark:border-surface-800">
      {status === 'PENDING' ? (
        <div className="flex gap-3">
          <button
            onClick={onApprove}
            className="flex-1 px-6 py-3 rounded-xl bg-success-600 hover:bg-success-700 text-white font-semibold transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Qabul qilish
          </button>
          <button
            onClick={onReject}
            className="flex-1 px-6 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white font-semibold transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Rad etish
          </button>
        </div>
      ) : status === 'APPROVED' && (
        <button
          onClick={onAddStudent}
          className="w-full px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors duration-150 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Talabalar ro'yxatiga qo'shish
        </button>
      )}

      <button
        onClick={onDelete}
        className="w-full mt-4 px-6 py-3 rounded-xl border-2 border-danger-600 text-danger-600 hover:bg-danger-600 hover:text-white font-semibold transition-colors duration-150 flex items-center justify-center gap-2"
      >
        <Trash2 className="w-5 h-5" />
        Arizani o'chirib tashlash
      </button>
    </div>
  );
};

export default ApplicationActions;
