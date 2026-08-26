import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, XCircle, UserPlus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../data/api';
import { invalidateApplicationCaches } from '../../utils/cacheUtils';
import { useGlobalEvents } from '../../utils/globalEvents';
import AddStudentModal from './AddStudentModal';
import { Application, normalizeStatus } from './types';

function ConfirmModal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
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
            className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ApplicationActions({ application, id, onChanged }: { application: Application; id: string; onChanged: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { emitApplicationUpdate, emitStudentUpdate } = useGlobalEvents();

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await api.approveApplication(id, { admin_comment: comment.trim() || 'Qabul qilindi' });
      toast.success('Ariza qabul qilindi!');
      setShowApproveModal(false);
      setComment('');
      await invalidateApplicationCaches(queryClient);
      onChanged();
      emitApplicationUpdate({ action: 'approved', id });
      emitStudentUpdate({ action: 'created' });
    } catch (err) {
      toast.error((err as Error)?.message || 'Xatolik yuz berdi!');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error('Rad etish sababini yozing!');
      return;
    }
    setLoading(true);
    try {
      await api.rejectApplication(id, { admin_comment: comment.trim() });
      toast.success('Ariza rad etildi!');
      setShowRejectModal(false);
      setComment('');
      await invalidateApplicationCaches(queryClient);
      onChanged();
      emitApplicationUpdate({ action: 'rejected', id });
    } catch (err) {
      toast.error((err as Error)?.message || 'Xatolik yuz berdi!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteApplication(id);
      toast.success('Ariza muvaffaqiyatli o\'chirildi');
      await invalidateApplicationCaches(queryClient);
      navigate('/applications');
    } catch (err) {
      toast.error((err as Error)?.message || 'Arizani o\'chirishda xatolik yuz berdi');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const status = normalizeStatus(application.status);

  return (
    <div className="mt-6">
      <div className="pt-4 border-t border-surface-200 dark:border-surface-800">
        {status === 'PENDING' ? (
          <div className="flex gap-3">
            <button
              onClick={() => setShowApproveModal(true)}
              className="flex-1 px-6 py-3 rounded-xl bg-success-600 hover:bg-success-700 text-white font-semibold transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Qabul qilish
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex-1 px-6 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white font-semibold transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Rad etish
            </button>
          </div>
        ) : status === 'APPROVED' && (
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="w-full px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Talabalar ro'yxatiga qo'shish
          </button>
        )}

        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full mt-4 px-6 py-3 rounded-xl border-2 border-danger-600 text-danger-600 hover:bg-danger-600 hover:text-white font-semibold transition-colors duration-150 flex items-center justify-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          Arizani o'chirib tashlash
        </button>
      </div>

      <ConfirmModal open={showApproveModal} onClose={() => setShowApproveModal(false)}>
        <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Arizani qabul qilish</h3>
        <p className="text-surface-600 dark:text-surface-400 mb-4">Rostdan ham bu arizani qabul qilmoqchimisiz?</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Izoh (ixtiyoriy)"
          className="w-full px-4 py-3 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-success-500 focus:border-transparent resize-none"
          rows={3}
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => { setShowApproveModal(false); setComment(''); }}
            className="flex-1 px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-xl text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-xl transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saqlanmoqda...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Qabul qilish
              </>
            )}
          </button>
        </div>
      </ConfirmModal>

      <ConfirmModal open={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Arizani rad etish</h3>
        <p className="text-surface-600 dark:text-surface-400 mb-4">Rad etish sababini yozing:</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Sabab..."
          className="w-full px-4 py-3 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-danger-500 focus:border-transparent resize-none"
          rows={3}
          required
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => { setShowRejectModal(false); setComment(''); }}
            className="flex-1 px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-xl text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleReject}
            disabled={loading || !comment.trim()}
            className="flex-1 px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saqlanmoqda...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Rad etish
              </>
            )}
          </button>
        </div>
      </ConfirmModal>

      <ConfirmModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="w-16 h-16 bg-danger-50 dark:bg-danger-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-danger-500">
          <Trash2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2 text-center">Arizani o'chirish?</h3>
        <p className="text-surface-600 dark:text-surface-400 mb-6 text-center">
          Siz haqiqatan ham ushbu arizani butunlay o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="flex-1 px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-xl text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150 font-semibold"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
      </ConfirmModal>

      <AddStudentModal
        application={application}
        open={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={() => { emitStudentUpdate({ action: 'created' }); onChanged(); }}
      />
    </div>
  );
}
