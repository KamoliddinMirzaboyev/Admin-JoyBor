import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../data/api';
import {
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Search,
  X,
  Check
} from 'lucide-react';
import Skeleton from '../components/UI/Skeleton';
import EmptyState from '../components/UI/EmptyState';
import { useSEO } from '../hooks/useSEO';
import { toast } from 'sonner';


interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  image?: string | null;
}

const Notifications: React.FC = () => {
  // SEO
  useSEO('notifications');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [createTarget, setCreateTarget] = useState<'all_students' | 'all_admins' | 'specific_user'>('all_students');

  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await api.getNotifications();
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60,
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationAsRead(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

      // Optimistically update
      queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
        if (!old) return [];
        return old.map(n => n.id === id ? { ...n, is_read: true } : n);
      });

      return { previousNotifications };
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onError: (_err, _id, context) => {
      // Revert on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
      toast.error("O'qilgan deb belgilashda xatolik");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const createNotificationMutation = useMutation({
    mutationFn: () =>
      api.createAdminNotification({
        message: createMessage.trim(),
        target_type: createTarget,
        is_active: true,
      }),
    onSuccess: () => {
      toast.success('Bildirishnoma yuborildi');
      setShowCreate(false);
      setCreateMessage('');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Yuborishda xatolik');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

      queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
        if (!old) return [];
        return old.map(n => ({ ...n, is_read: true }));
      });

      return { previousNotifications };
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onError: (_err, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
      toast.error("Xatolik yuz berdi");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onSuccess: () => {
      toast.success("Barchasi o'qilgan deb belgilandi");
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.type === 'application') {
      window.location.href = '/applications';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' ||
      (filterType === 'unread' && !n.is_read) ||
      (filterType === 'read' && n.is_read);
    return matchesSearch && matchesFilter;
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Navbar.tsx dagi bildirishnoma turi -> rang xaritasi bilan mos
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <div className="p-2 bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 rounded-lg"><CheckCircle className="w-5 h-5" /></div>;
      case 'warning': return <div className="p-2 bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 rounded-lg"><AlertCircle className="w-5 h-5" /></div>;
      case 'error': return <div className="p-2 bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 rounded-lg"><AlertCircle className="w-5 h-5" /></div>;
      default: return <div className="p-2 bg-info-100 dark:bg-info-900/30 text-info-600 dark:text-info-400 rounded-lg"><Info className="w-5 h-5" /></div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 pt-20 pb-10 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 pt-20 pb-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
              <Bell className="w-8 h-8 text-brand-500" />
              Bildirishnomalar
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1">Sizga kelgan so'nggi xabarlar va bildirishnomalar</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors duration-150"
            >
              Yangi bildirishnoma
            </button>
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              className="px-4 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-semibold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors duration-150 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Barchasini o'qilgan qilish
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-4 mb-6 space-y-3">
            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-200">
              Xabar matni
            </label>
            <textarea
              value={createMessage}
              onChange={(e) => setCreateMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 outline-none focus:ring-2 focus:ring-brand-500/40"
              placeholder="Talabalarga yuboriladigan xabar..."
            />
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <select
                value={createTarget}
                onChange={(e) =>
                  setCreateTarget(e.target.value as 'all_students' | 'all_admins' | 'specific_user')
                }
                className="px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm"
              >
                <option value="all_students">Barcha talabalar</option>
                <option value="all_admins">Barcha adminlar</option>
              </select>
              <button
                disabled={!createMessage.trim() || createNotificationMutation.isPending}
                onClick={() => createNotificationMutation.mutate()}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-brand-700"
              >
                {createNotificationMutation.isPending ? 'Yuborilmoqda...' : 'Yuborish'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-4 mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Bildirishnomalarni qidirish..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/40 transition-colors duration-150"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'unread', 'read'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                  filterType === type
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-50 dark:bg-surface-900 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                }`}
              >
                {type === 'all' ? 'Barchasi' : type === 'unread' ? 'O\'qilmagan' : 'O\'qilgan'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {sortedNotifications.length > 0 ? (
              sortedNotifications.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleNotificationClick(n)}
                  className={`relative group p-4 rounded-2xl border shadow-sm hover:shadow-md transition-colors duration-150 cursor-pointer ${
                    n.is_read
                      ? 'bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700 opacity-75'
                      : 'bg-white dark:bg-surface-800 border-brand-200 dark:border-brand-900 ring-1 ring-brand-50 dark:ring-brand-900/20'
                  } hover:border-brand-300 dark:hover:border-brand-700`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">{getIcon(n.type)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          n.type === 'application'
                            ? 'text-brand-600 bg-brand-100 dark:text-brand-400 dark:bg-brand-900/30'
                            : 'text-surface-600 bg-surface-100 dark:text-surface-400 dark:bg-surface-700'
                        }`}>
                          {n.type === 'application' ? 'Ariza' : 'Bildirishnoma'}
                        </span>
                        <span className="text-xs text-surface-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(n.created_at).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>

                      <p className={`text-sm md:text-base leading-relaxed ${n.is_read ? 'text-surface-600 dark:text-surface-400' : 'text-surface-900 dark:text-white font-medium'}`}>
                        {n.message}
                      </p>

                      {n.image && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 max-w-sm">
                          <img
                            src={n.image}
                            alt="Notification"
                            className="w-full h-auto object-cover max-h-48 cursor-zoom-in"
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(n.image!); }}
                          />
                        </div>
                      )}
                    </div>

                    {!n.is_read && (
                      <div className="flex-shrink-0 self-center flex flex-col items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-brand-500 rounded-full shadow-lg shadow-brand-500/50 animate-pulse" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsReadMutation.mutate(n.id);
                          }}
                          disabled={markAsReadMutation.isPending && markAsReadMutation.variables === n.id}
                          className="p-1.5 rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-200 dark:hover:bg-brand-800/50 transition-colors duration-150 opacity-0 group-hover:opacity-100"
                          title="O'qilgan deb belgilash"
                        >
                          {markAsReadMutation.isPending && markAsReadMutation.variables === n.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-surface-800 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700"
              >
                <EmptyState
                  icon={Bell}
                  title="Bildirishnomalar topilmadi"
                  description="Hozircha hech qanday yangilik yo'q"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full transition-colors duration-150"
              >
                <X className="w-8 h-8" />
              </button>
              <img src={selectedImage} alt="Full size" className="w-full h-auto rounded-2xl shadow-sm" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;
