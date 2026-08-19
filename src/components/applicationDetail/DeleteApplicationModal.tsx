import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface DeleteApplicationModalProps {
  open: boolean;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteApplicationModal: React.FC<DeleteApplicationModalProps> = ({ open, deleting, onConfirm, onClose }) => (
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
          <div className="w-16 h-16 bg-danger-50 dark:bg-danger-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-danger-500">
            <Trash2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2 text-center">
            Arizani o'chirish?
          </h3>
          <p className="text-surface-600 dark:text-surface-400 mb-6 text-center">
            Siz haqiqatan ham ushbu arizani butunlay o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-xl text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150 font-semibold"
            >
              Bekor qilish
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  O'chirilmoqda...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  O'chirish
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default DeleteApplicationModal;
