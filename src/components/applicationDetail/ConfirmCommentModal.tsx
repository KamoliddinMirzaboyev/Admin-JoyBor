import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmCommentModalProps {
  open: boolean;
  variant: 'success' | 'danger';
  title: string;
  description: string;
  placeholder: string;
  comment: string;
  onCommentChange: (value: string) => void;
  confirmLabel: string;
  confirmIcon: React.ReactNode;
  loading: boolean;
  loadingLabel: string;
  required?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const variantClasses = {
  success: {
    ring: 'focus:ring-success-500',
    button: 'bg-success-600 hover:bg-success-700',
  },
  danger: {
    ring: 'focus:ring-danger-500',
    button: 'bg-danger-600 hover:bg-danger-700',
  },
};

const ConfirmCommentModal: React.FC<ConfirmCommentModalProps> = ({
  open,
  variant,
  title,
  description,
  placeholder,
  comment,
  onCommentChange,
  confirmLabel,
  confirmIcon,
  loading,
  loadingLabel,
  required,
  onConfirm,
  onClose,
}) => {
  const styles = variantClasses[variant];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-4">{title}</h3>
            <p className="text-surface-600 dark:text-surface-400 mb-4">{description}</p>
            <textarea
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder={placeholder}
              className={`w-full px-4 py-3 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 ${styles.ring} focus:border-transparent resize-none`}
              rows={3}
              required={required}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-xl text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150"
              >
                Bekor qilish
              </button>
              <button
                onClick={onConfirm}
                disabled={loading || (required && !comment.trim())}
                className={`flex-1 px-4 py-2 text-white rounded-xl transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2 ${styles.button}`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {loadingLabel}
                  </>
                ) : (
                  <>
                    {confirmIcon}
                    {confirmLabel}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmCommentModal;
